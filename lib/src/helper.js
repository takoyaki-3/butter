const crypto = require('crypto')
const axios = require('axios')
const pako = require('pako')
const inflate = pako.inflate

global.CONFIG = {
  debug: true,
  cacheSize: 1024,
  useFetch: false
}
const RUNTIME = {
  cache: {},
  consumedOp: 0
}

/**
 * 指定されたURLからリソースをフェッチし、ArrayBufferとして返します。
 * @param {string} url - リソースをフェッチするURL。
 * @returns {Promise<ArrayBuffer>} フェッチされたリソースをArrayBufferとして解決するプロミス。
 * @throws {Error} フェッチリクエストが失敗した場合にエラーを投げます。
 */
export const fetchAsArrayBuffer = async (url) => {
  try {
    let response;
    if (CONFIG.useFetch) {
      response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return buffer;
    } else {
      response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      return response.data;
    }
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw new Error(`Failed to fetch ${url}`);
  }
}

/**
 * PEM形式の文字列を公開鍵に変換します。
 * @param {string} pem - PEM形式の文字列。
 * @returns {Promise<CryptoKey>} インポートされた公開鍵を解決するプロミス。
 */
const pemToPublicKey = async (pem) => {
  const uint8Array = pemToUint8Array(pem)
  return await crypto.subtle.importKey(
    'spki',
    uint8Array,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['verify']
  )
}

/**
 * PEM形式の文字列をUint8Arrayに変換します。
 * @param {string} pem - PEM形式の文字列。
 * @returns {Uint8Array} PEM文字列のUint8Array表現。
 */
export const pemToUint8Array = (pem) => {
  const base64String = pem.replace(/-----[A-Z ]+-----/g, '').trim()
  const raw = window.atob(base64String)
  const uint8Array = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    uint8Array[i] = raw.charCodeAt(i)
  }
  return uint8Array
}

let cachedPublicKey = null

/**
 * キャッシュされた公開鍵を取得するか、キャッシュされていない場合は指定されたURLからフェッチします。
 * @param {string} url - 公開鍵をフェッチするURL。
 * @returns {Promise<CryptoKey>} 公開鍵を解決するプロミス。
 */
const getPublicKeyFromCache = async (url) => {
  if (!cachedPublicKey) {
    let response;
    if (CONFIG.useFetch) {
      response = await fetch(url);
      const text = await response.text();
      cachedPublicKey = await pemToPublicKey(text);
    } else {
      response = await axios.get(url, { responseType: 'text' });
      cachedPublicKey = await pemToPublicKey(response.data);
    }
  }
  return cachedPublicKey;
}

/**
 * 指定されたURLからのコンテンツの署名を公開鍵を使用して検証します。
 * @param {string} publicKeyUrl - 公開鍵をフェッチするURL。
 * @param {string} contentUrl - コンテンツをフェッチするURL。
 * @param {string} signatureUrl - 署名をフェッチするURL。
 * @returns {Promise<boolean>} 署名の検証結果を解決するプロミス。
 */
const verifySignatureFromUrls = async (publicKeyUrl, contentUrl, signatureUrl) => {
  // SSLでない場合など、crypto.subtleが存在しない場合は常にtrueを返す
  if (crypto.subtle === undefined) return true

  const [publicKey, content, signature] = await Promise.all([
    getPublicKeyFromCache(publicKeyUrl),
    fetchAsArrayBuffer(contentUrl),
    fetchAsArrayBuffer(signatureUrl)
  ])

  return await crypto.subtle.verify(
    {
      name: 'RSASSA-PKCS1-v1_5'
    },
    publicKey,
    signature,
    content
  )
}

/**
 * Helperオブジェクトは、キャッシュ操作、暗号化、日付処理などのユーティリティ関数を提供します。
 */
export const helper = {
  setUseFetch (useFetch) {
    CONFIG.useFetch = useFetch;
  },

  /**
   * キャッシュにオブジェクトを保存します。キャッシュサイズが最大に達している場合、ランダムなアイテムを削除します。
   * @param {string} key - キャッシュするオブジェクトのキー。
   * @param {any} obj - キャッシュするオブジェクト。
   * @param {Object} kvStore - キャッシュを格納するオブジェクト。デフォルトはRUNTIME.cache。
   * @param {number} cacheMaxSize - キャッシュの最大サイズ。デフォルトはCONFIG.cacheSize。
   */
  storeCache (key, obj, kvStore = RUNTIME.cache, cacheMaxSize = CONFIG.cacheSize) {
    const keys = Object.keys(kvStore)
    if (keys.length >= cacheMaxSize) {
      const randIndex = Math.floor(Math.random() * keys.length)
      delete kvStore[keys[randIndex]]
    }
    kvStore[key] = obj
  },

  /**
   * 指定されたキーに対応するキャッシュを取得します。
   * @param {string} key - 取得するキャッシュのキー。
   * @param {Object} kvStore - キャッシュが格納されているオブジェクト。デフォルトはRUNTIME.cache。
   * @returns {any} キャッシュされたオブジェクト、またはキャッシュがない場合はundefined。
   */
  loadCache (key, kvStore = RUNTIME.cache) {
    return kvStore[key]
  },

  fetchPublicKey: async (url) => {
    try {
      let response;
      if (CONFIG.useFetch) {
        response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch the public key');
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
      } else {
        response = await axios.get(url, { responseType: 'arraybuffer' });
        if (response.status !== 200) throw new Error('Failed to fetch the public key');
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching public key: ', error);
      throw error;
    }
  },
  verifyFileSignature: async (url, publicKey) => {
    try {
      // ファイルの取得
      let fileResponse;
      let sigResponse;
      if (CONFIG.useFetch) {
        fileResponse = await fetch(url);
        sigResponse = await fetch(`${url}.sig`);
        if (!fileResponse.ok || !sigResponse.ok) {
          throw new Error('Failed to fetch the file or signature');
        }
        const fileContent = await fileResponse.arrayBuffer();
        const sigContent = await sigResponse.arrayBuffer();
      } else {
        fileResponse = await axios.get(url, { responseType: 'arraybuffer' });
        sigResponse = await axios.get(`${url}.sig`, { responseType: 'arraybuffer' });
        if (fileResponse.status !== 200 || sigResponse.status !== 200) {
          throw new Error('Failed to fetch the file or signature');
        }
        const fileContent = fileResponse.data;
        const sigContent = sigResponse.data;
      }
  
      console.log('File Content:', fileContent);
      console.log('Signature Content:', sigContent);
  
      const fileHash = await helper.hash.SHA256(new Uint8Array(fileContent));
      console.log('File Hash:', fileHash);
  
      return await helper.verifySignature(publicKey, fileHash, new Uint8Array(sigContent));
    } catch (error) {
      console.error('Verification failed', error);
      return false;
    }
  },
  verifySignature: async function (publicKey, messageHash, signature) {
    try {
      // TODO ここが正しく実行されているか要検証
      publicKey = pemToUint8Array(publicKey)
      console.log(publicKey, messageHash, signature)
      console.log('Public Key at verifySignature:', publicKey)
      const importedKey = await window.crypto.subtle.importKey(
        'spki',
        publicKey,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['verify']
      )
      console.log('Imported Key:', importedKey)

      return crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        importedKey
        // uint8ToArrayBuffer(signature),
        // uint8ToArrayBuffer(messageHash)
      )
    } catch (error) {
      console.error('Error in verifySignature:', error)
      throw error // re-throw the error after logging it
    }
  },
  async fetchJSON (url, publicKeyUrl) {
    const cache = helper.loadCache(url);
    if (cache) {
      return cache;
    }
    try {
      if (CONFIG.debug) {
        console.log(url);
      }
      RUNTIME.consumedOp++;
  
      let response;
      if (CONFIG.useFetch) {
        response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch JSON');
      } else {
        response = await axios.get(url);
      }
  
      // 署名の検証
      const contentUrl = url;
      const signatureUrl = url + '.sig';
      const isValid = await verifySignatureFromUrls(publicKeyUrl, contentUrl, signatureUrl);
      if (!isValid) {
        throw new Error('Invalid signature');
      }
  
      // JSONを解析
      const data = CONFIG.useFetch ? await response.json() : response.data;
      helper.storeCache(url, data);
      return data;
    } catch (e) {
      console.log({error: e});
      throw new Error('something wrong2');
    }
  },
  /**
   * 指定されたURLからJSONを取得し、パースします。
   * @param {string} url - データを取得するURL。
   * @returns {Promise<Object>} - パースされたJSONオブジェクト。
   */
  async fetchAndParseJSON (url) {
    try {
      let data;
      if (CONFIG.useFetch) {
        console.log('useFetch')
        const response = await fetch(url);
        data = await response.json()
        // レスポンスのステータスやヘッダーをログに出力
        console.log('Response Status:', response.status);
        console.log('Response Headers:', [...response.headers]);
        console.log('Response Data:', data);
        if (!response.ok) throw new Error('Failed to fetch JSON');
      } else {
        const response = await axios.get(url);
        data = response.data
      }

      // レスポンスデータは自動的にJSONとしてパースされます
      return data
    } catch (error) {
      console.error({error})
      // ネットワークエラーや非200ステータスコードをキャッチ
      if (error.response) {
        // サーバーからのレスポンスがあるが、エラーステータスコードの場合
        throw new Error('Failed to fetch data: ' + error.response.status)
      } else if (error.request) {
        // リクエストが送られたが、レスポンスがない場合
        throw new Error('No response received for the request.')
      } else {
        // リクエストの設定中に何らかのエラーが発生した場合
        throw new Error('Error in request setup: ' + error.message)
      }
    }
  },
  async fetchTarCSV (url) {
    const cache = helper.loadCache(url)
    if (cache) {
      return cache
    }
    // tarファイルを解凍する関数
    // 機能的には関数に独立させたいが，この関数の内部でしか使わないのでここでいいや
    const untar = (data) => {
      const files = []
      const headerSize = 512
      let offset = 0

      while (offset < data.length) {
        const header = data.slice(offset, offset + headerSize)

        // データ変換のための環境判定
        let nameEncoded, sizeEncoded
        if (typeof Buffer !== 'undefined') {
          // Node.js 環境
          nameEncoded = Buffer.from(header.subarray(0, 100)).toString('utf8').replace(/\0/g, '').trim()
          sizeEncoded = Buffer.from(header.subarray(124, 136)).toString('utf8').trim()
        } else {
          // ブラウザ環境
          nameEncoded = new TextDecoder('utf-8').decode(header.subarray(0, 100)).replace(/\0/g, '').trim()
          sizeEncoded = new TextDecoder('utf-8').decode(header.subarray(124, 136)).trim()
        }
        const name = decodeURI(nameEncoded)
        const size = parseInt(sizeEncoded, 8)
        offset += headerSize

        if (name) {
          const buffer = data.slice(offset, offset + size)
          files.push({ name, size, buffer })
        }

        offset += size
        if (size % 512 !== 0) {
          offset += 512 - (size % 512)
        }
      }
      return files
    }

    if (CONFIG.debug) {
      console.log(url)
    }
    try {
      RUNTIME.consumedOp++
      let response, gzipData;
      if (CONFIG.useFetch) {
        response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Tar CSV');
        const arrayBuffer = await response.arrayBuffer();
        gzipData = new Uint8Array(arrayBuffer);
      } else {
        response = await axios.get(url, { responseType: 'arraybuffer' });
        if (response.status !== 200) throw new Error('Failed to fetch Tar CSV');
        gzipData = new Uint8Array(response.data);
      }

      // gzip形式のデータを解凍する
      const rawBytes = inflate(gzipData)

      // tarファイルを解凍する
      const files = untar(rawBytes)

      const ret = {}

      // ファイルの中身を操作する
      files.forEach((file) => {
        const name = file.name
        // データ変換のための環境判定
        let content
        if (typeof Buffer !== 'undefined') {
          // Node.js 環境
          content = Buffer.from(file.buffer).toString('utf8')
        } else {
          // ブラウザ環境
          content = new TextDecoder('utf-8').decode(file.buffer)
        }
        if (name.endsWith('.sig')) {
          // TODO: 署名ファイルの処理
        } else {
          const obj = helper.csvToObject(content)
          ret[name] = obj
        }
      })

      helper.storeCache(url, ret)
      return ret
    } catch (error) {
      console.error(error)
      throw new Error('something wrong') // TODO: エラーメッセージを具体化
    }
  },
  fetchCSV: async (url) => {
    const cache = helper.loadCache(url);
    if (cache) {
      return cache;
    }
  
    try {
      if (CONFIG.debug) {
        console.log(url);
      }
      RUNTIME.consumedOp++;
  
      let response;
      if (CONFIG.useFetch) {
        response = await fetch(url);
        if (!response.ok) throw new Error('something wrong');
        const text = await response.text();
        const data = helper.csvToObject(text);
        helper.storeCache(url, data);
        return data;
      } else {
        response = await axios.get(url, { responseType: 'text' });
        if (response.status !== 200) throw new Error('something wrong');
        const data = helper.csvToObject(response.data);
        helper.storeCache(url, data);
        return data;
      }
    } catch (error) {
      console.error(error);
      throw new Error('something wrong');
    }
  },

  /**
   * CSV形式の文字列をオブジェクトの配列に変換します。
   * @param {string} csv - 変換するCSV形式の文字列。
   * @returns {Object[]} ヘッダーをキーとするオブジェクトの配列。
   */
  csvToObject (csv) {
    const lines = csv.replace(/\r/g, '').trim().split('\n')
    const headers = lines.shift().split(',')
    return lines.map(line => {
      const values = line.split(',')
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index]
        return obj
      }, {})
    })
  },

  async sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },
  parseDate (dateStr) {
    // YYYYMMDDの形式
    const year = dateStr.slice(0, 4)
    const month = dateStr.slice(4, 6)
    const day = dateStr.slice(6, 8)
    return new Date(`${year}-${month}-${day}`)
  },
  getDayOfWeek (dateStr) {
    const date = helper.parseDate(dateStr)

    // 曜日を取得する
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[date.getDay()]
  },
  // isHoliday (dateStr) {
  //   const dayOfWeek = helper.getDayOfWeek(dateStr)
  //   flags = [
  //     ['土', '日'].includes(dayOfWeek)
  //   ]
  //   return flags.some(f => f)
  // },

  /**
   * 二つのセットの共通要素を含む新しいセットを返します。
   * @param {Set<any>} setA - 最初のセット。
   * @param {Set<any>} setB - 二番目のセット。
   * @returns {Set<any>} 両セットの共通要素を含む新しいセット。
   */
  setIntersection (setA, setB) {
    const intersection = new Set()
    setB.forEach(e => {
      if (setA.has(e)) intersection.add(e)
    })
    return intersection
  },

  /**
   * 現在のRUNTIMEで消費された操作の数を返します。
   * @returns {number} 消費された操作の数。
   */
  getConsumedOp () {
    return RUNTIME.consumedOp
  },

  hash: {

    /**
     * 与えられたメッセージのSHA-256ハッシュを計算します。
     * @param {string} msg - ハッシュを計算するメッセージ。
     * @returns {Promise<string>} メッセージのSHA-256ハッシュ。
     */
    async SHA256 (msg) {
      return crypto.createHash('sha256').update(msg, 'utf8').digest('hex')
    },

    async v1 (str, mod) {
      const hash = helper.hash.SHA256(str)
      if (CONFIG.debug) {
        console.log(str, hash)
      }
      return (await hash).slice(0, mod)
    },
    async v2 (str, mod) {
      const hash = helper.hash.SHA256(encodeURI(str))
      if (CONFIG.debug) {
        console.log(str, hash)
      }
      return (await hash).slice(0, mod)
    }
  }
}
