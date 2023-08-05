const pako = require('pako')
const inflate = pako.inflate;

let CONFIG = {
  debug: true,
  cacheSize: 50
}
let RUNTIME = {
  cache: {},
  consumedOp: 0,
}

// 名前から機能が推定できる注入可能なレベルに疎な関数をhelperとしてまとめる
export const helper = {
  storeCache(key, obj, kvStore = RUNTIME.cache, cacheMaxSize = CONFIG.cacheSize) {
      const len = Object.keys(kvStore).length
      if (len >= cacheMaxSize) {
          const rand = Math.floor(Math.random() * len)
          delete kvStore[Object.keys()[rand]]
      }
      kvStore[key] = obj
  },
  loadCache(key, kvStore = RUNTIME.cache) {
      if (kvStore[key]) {
          return kvStore[key]
      }
      let NULL
      return NULL
  },
  async fetchJSON(url) {
      const cache = helper.loadCache(url)
      if (cache) {
          return cache
      }
      try {
          if (CONFIG.debug) {
              console.log(url)
          }
          RUNTIME.consumedOp++
          const resp = await fetch(url)
          if (!resp.ok) {
              throw new Error("something wrong") // TODO
          }
          const data = await resp.json()
          helper.storeCache(url, data)
          return data
      } catch {
          throw new Error("something wrong") // TODO
      }
  },
  async fetchTarCSV(url) {
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
              const header = new Uint8Array(data.slice(offset, offset + headerSize))
              const nameEncoded = new TextDecoder().decode(header.subarray(0, 100)).replace(/\u0000/g, '').trim()
              const name = decodeURI(nameEncoded)
              const size = parseInt(new TextDecoder().decode(header.subarray(124, 136)).trim(), 8)
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
          const resp = await fetch(url)
          if (!resp.ok) {
              throw new Error("something wrong") // TODO
          }
          const gzipData = await resp.arrayBuffer()

          // gzip形式のデータを解凍する
          const rawBytes = inflate(gzipData)

          // tarファイルを解凍する
          const files = untar(rawBytes)

          let ret = {}

          // ファイルの中身を操作する
          files.forEach((file) => {
              const name = file.name
              const content = new TextDecoder('utf-8').decode(file.buffer)
              if (name.endsWith(".sig")) {
                  // TODO
              } else {
                  const obj = helper.csvToObject(content)
                  ret[name] = obj
              }
          })
          helper.storeCache(url, ret)
          return ret
      } catch {
          throw new Error("something wrong") // TODO
      }
  },
  async fetchCSV(url) {
      const cache = helper.loadCache(url)
      if (cache) {
          return cache
      }
      try {
          if (CONFIG.debug) {
              console.log(url)
          }
          RUNTIME.consumedOp++
          const resp = await fetch(url)
          if (!resp.ok) {
              throw new Error("something wrong") // TODO
          }
          const text = await resp.text()
          const data = helper.csvToObject(text)
          helper.storeCache(url, data)
          return data
      } catch {
          throw new Error("something wrong") // TODO
      }
  },
  csvToObject(csv) {
      const lines = csv.replace(/\r/g, "").trim().split('\n') // 行に分割
      const headers = lines.shift().split(',') // ヘッダーを取得
      return lines.map(line => {
          const values = line.split(',') // 値を取得
          return headers.reduce((obj, header, index) => {
              obj[header] = values[index] // ヘッダーと値を組み合わせてオブジェクトを生成
              return obj
          }, {})
      })
  },
  async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
  },
  parseDate(dateStr) {
      // YYYYMMDDの形式
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return new Date(`${year}-${month}-${day}`);
  },
  getDayOfWeek(dateStr) {
      const date = helper.parseDate(dateStr)

      // 曜日を取得する
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      return weekdays[date.getDay()];
  },
  isHoliday(dateStr) {
      const dayOfWeek = helper.getDayOfWeek(dateStr)
      flags = [
          ["土", "日"].includes(dayOfWeek)
      ]
      return flags.some(f => f)
  },
  setIntersection(setA, setB) {
      let ret = new Set()
      for (const e of setB) {
          if (setA.has(e)) {
              ret.add(e);
          }
      }
      return ret;
  },
  getConsumedOp(){
    return RUNTIME.consumedOp
  },
  hash: {
      async SHA256(msg) {
          const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg))
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
      },
      async v1(str, mod) {
          const hash = helper.hash.SHA256(str)
          if (CONFIG.debug) {
              {
                  str, hash
              }
          }
          return (await hash).slice(0, mod)
      },
      async v2(str, mod) {
          const hash = helper.hash.SHA256(encodeURI(str))
          if (CONFIG.debug) {
              {
                  str, hash
              }
          }
          return (await hash).slice(0, mod)
      }
  }
}
