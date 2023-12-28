const helperLib = require('./helper.js')
const helper = helperLib.helper

export class ButterInternal{
    constructor(rootCA){
        this.CONFIG = {}
        this.RUNTIME = {
          isReady: false,
          readyFlags: {
            ca: false
          },
          cache: {},
          pub_key: ''
        }
        this.setCA(rootCA)
    }

    /**
     * CA（証明書発行局）の設定を行います。
     * @param {string} rootCA - CAのルートURL。
     * @returns {Promise<void>} - 処理が完了したら解決されるPromise。
     */
    async setCA (rootCA) {
      // 末尾をスラッシュなしに統一する
      if (!rootCA.endsWith('root.json')) {
        return // TODO ファイルがなかった場合のエラー処理
      }
      this.CONFIG.rootCA = rootCA
  
      let req
      try {
        req = await this.fetchAndParseJSON(this.CONFIG.rootCA)
      } catch {
        throw new Error('Failed to fetch rootCA')
      }
  
      this.RUNTIME.CA = req
      this.RUNTIME.pub_key = req.pub_keys[0].pubkey
  
      const hostList = []
      const oneMouthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30日前の日時を設定します
  
      for (let i = 0; i < this.RUNTIME.CA.hosts.length; i++) {
        const host = this.RUNTIME.CA.hosts[i]
  
        try { // ホストからのデータ取得を試みる
          const data = await helper.fetchJSON(`${host}/datalist.json`, this.RUNTIME.pub_key)
          if (data.updated === null) continue
  
          // updatedをISO 8601形式に変換します
          const updatedISO = data.updated.replace(/_/g, ':')
          const updatedDate = new Date(updatedISO) // Dateオブジェクトを生成します
          if (updatedDate > oneMouthAgo) { // 30日以内に更新されていれば、hostListに追加します
            hostList.push(host)
          }
        } catch (e) {
          console.log(`Failed to fetch data from ${host}:`, e.message) // エラーメッセージをログに出力
          continue // このホストはスキップし、次のホストへ移動
        }
      }
      // ランダムにホストを選びます
      if (hostList.length > 0) {
        const randomIndex = Math.floor(Math.random() * hostList.length)
        this.RUNTIME.host = hostList[randomIndex]
        console.log(`host: ${this.RUNTIME.host}`)
      } else {
        console.log('there are no host which updated last 30 days.')
        const randomIndex = Math.floor(Math.random() * this.RUNTIME.CA.hosts.length)
        this.RUNTIME.host = this.RUNTIME.CA.hosts[randomIndex]
        console.log(`host: ${this.RUNTIME.host}`)
      }
  
      this.RUNTIME.readyFlags = {}
      this.RUNTIME.readyFlags.ca = true
    }
  
    /**
     * 指定されたURLからJSONを取得し、パースします。
     * @param {string} url - データを取得するURL。
     * @returns {Promise<Object>} - パースされたJSONオブジェクト。
     */
    async fetchAndParseJSON (url) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch data.')
      }
  
      // レスポンス内容をパースしてJSON形式であるかのチェック
      let parsedData
      try {
        parsedData = await response.json()
      } catch (e) {
        throw new Error('Failed to parse response as JSON.')
      }
      return parsedData
    }
  
    /**
     * CAの準備が完了するまで待機します。
     * @returns {Promise<void>} - CAの準備が完了したら解決されるPromise。
     */
    async waitReady () {
      while (!this.RUNTIME.isReady) {
        await helper.sleep(100)
        if (Object.values(this.RUNTIME.readyFlags).every(e => e)) {
          this.RUNTIME.isReady = true
        }
      }
    }

    async waitCAReady () {
      while (!this.RUNTIME.readyFlags.ca) {
        await helper.sleep(100)
      }
    }
  
    /**
     * 緯度と経度から距離を計算します。
     * @param {number} lat1 - 最初の緯度。
     * @param {number} lon1 - 最初の経度。
     * @param {number} lat2 - 2番目の緯度。
     * @param {number} lon2 - 2番目の経度。
     * @returns {number} - 計算された距離（km単位）。
     */
    async distance (lat1, lon1, lat2, lon2) {
      const R = 6371 // 地球の半径（km）
      const dLat = (lat2 - lat1) * (Math.PI / 180)
      const dLon = (lon2 - lon1) * (Math.PI / 180)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }
  }