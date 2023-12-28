// src/index.js
// Top level file is just a mixin of submodules & constants
'use strict'

const h3 = require('h3-js/legacy')
const axios = require('axios')
const haversine = require('haversine')
const protobuf = require('protobufjs')
const protoStr = require('./gtfs-realtime.proto.js')

const helperLib = require('./helper.js')
const helper = helperLib.helper

const CONFIG = {
  debug: true
}
const RUNTIME = {
  isReady: false,
  readyFlags: {
    ca: false
  },
  cache: {},
  pub_key: ''
}

const internal = {
  async setCA (rootCA) {
    // 末尾をスラッシュなしに統一する
    if (!rootCA.endsWith('root.json')) {
      return // TODO
    }
    CONFIG.rootCA = rootCA

    let req
    try {
      req = await this.fetchAndParseJSON(CONFIG.rootCA)
    } catch {
      throw new Error('Failed to fetch rootCA')
    }

    RUNTIME.CA = req
    RUNTIME.pub_key = req.pub_keys[0].pubkey

    const hostList = []
    const oneMouthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30日前の日時を設定します

    for (let i = 0; i < RUNTIME.CA.hosts.length; i++) {
      const host = RUNTIME.CA.hosts[i]

      try { // ホストからのデータ取得を試みる
        const data = await helper.fetchJSON(`${host}/datalist.json`, RUNTIME.pub_key)
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
      RUNTIME.host = hostList[randomIndex]
      console.log(`host: ${RUNTIME.host}`)
    } else {
      console.log('there are no host which updated last 30 days.')
      const randomIndex = Math.floor(Math.random() * RUNTIME.CA.hosts.length)
      RUNTIME.host = RUNTIME.CA.hosts[randomIndex]
      console.log(`host: ${RUNTIME.host}`)
    }

    RUNTIME.readyFlags.ca = true
  },
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
  },
  async waitReady () {
    while (!RUNTIME.isReady) {
      await helper.sleep(100)
      if (Object.values(RUNTIME.readyFlags).every(e => e)) {
        RUNTIME.isReady = true
      }
    }
  },
  async waitCAReady () {
    while (!RUNTIME.readyFlags.ca) {
      await helper.sleep(100)
    }
  },
  // 緯度・経度の距離を計算する関数
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

function addNumbers (a, b) {
  return a + b
}

const Butter = {
  addNumbers,
  async getHostUpdated () {
    const hostList = []

    for (let i = 0; i < RUNTIME.CA.hosts.length; i++) {
      const host = RUNTIME.CA.hosts[i]
      let updated

      try { // ホストからのデータ取得を試みる
        const data = await helper.fetchJSON(`${host}/datalist.json`, RUNTIME.pub_key)

        // updatedをISO 8601形式に変換します
        if (data.updated === null) continue
        const updatedISO = data.updated.replace(/_/g, ':')
        updated = new Date(updatedISO) // Dateオブジェクトを生成します
      } catch (e) {
        console.log(`Failed to fetch data from ${host}:`, e.message) // エラーメッセージをログに出力
        updated = 'Failed to access' // updatedにアクセス失敗の旨のメッセージをセット
      }

      hostList.push({
        host,
        updated
      })
    }

    return hostList
  },
  getComsumedOp () {
    return helper.getConsumedOp()
  },
  async getHostDataList () {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${RUNTIME.host}/datalist.json`, RUNTIME.pub_key)
    return data.data_list
  },
  async getAgencyInfo (gtfsID) {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${RUNTIME.host}/${gtfsID}/info.json`, RUNTIME.pub_key)
    return data
  },
  async getVersionInfo (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchJSON(`${RUNTIME.host}/${gtfsID}/${versionID}/info.json`, RUNTIME.pub_key)
    return data
  },
  async getBusStops (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/stops.txt`, RUNTIME.pub_key)
    return data
  },
  async getAgency (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/agency.txt`, RUNTIME.pub_key)
    return data
  },
  async getCalendar (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/calendar.txt`, RUNTIME.pub_key)
    return data
  },
  async getCalendarDates (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/calendar_dates.txt`, RUNTIME.pub_key)
    return data
  },
  async getFareAttributes (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/fare_attributes.txt`, RUNTIME.pub_key)
    return data
  },
  async getFareRules (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/fare_rules.txt`, RUNTIME.pub_key)
    return data
  },
  async getFeedInfo (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/feed_info.txt`, RUNTIME.pub_key)
    return data
  },
  async getOfficeJp (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/office_jp.txt`, RUNTIME.pub_key)
    return data
  },
  async getRoutes (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/routes.txt`, RUNTIME.pub_key)
    return data
  },
  async getShapes (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/shapes.txt`, RUNTIME.pub_key)
    return data
  },
  async getStopTimes (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/stop_times.txt`, RUNTIME.pub_key)
    return data
  },
  async getTransfers (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/transfers.txt`, RUNTIME.pub_key)
    return data
  },
  async getTranslations (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/translations.txt`, RUNTIME.pub_key)
    return data
  },
  async getTrips (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/trips.txt`, RUNTIME.pub_key)
    return data
  },
  async getTimeTableByStopHash (gtfsID, versionID, stopHash) {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchTarCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/byStops/${stopHash}.tar.gz`, RUNTIME.pub_key)
    return data
  },
  async getTimeTableByTripHash (gtfsID, versionID, tripHash) {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchTarCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/byTrips/${tripHash}.tar.gz`, RUNTIME.pub_key)
    return data
  },
  async getTimeTableByStopID (gtfsID, versionID, stopID) {
    const versionInfo = await Butter.getVersionInfo(gtfsID, versionID)
    const stopHash = await helper.hash.v2(stopID, versionInfo.by_stop_hash_value_size)
    const timeTables = await Butter.getTimeTableByStopHash(gtfsID, versionID, stopHash)
    return timeTables[stopID]
  },
  async getTimeTableByTripID (gtfsID, versionID, tripID) {
    const versionInfo = await Butter.getVersionInfo(gtfsID, versionID)
    const tripHash = await helper.hash.v2(tripID, versionInfo.by_trip_hash_value_size)
    const timeTables = await Butter.getTimeTableByTripHash(gtfsID, versionID, tripHash)
    return timeTables[tripID]
  },
  async getServiceIDs (gtfsID, versionID, dateStr) {
    const data = await Promise.all([
      Butter.getCalendar(gtfsID, versionID),
      Butter.getCalendarDates(gtfsID, versionID)
    ])
    const service = data[0]
    const calendar = data[1]

    const special = calendar.filter(e => {
      return e.date === dateStr
    })

    const addedServiceIds = special
      .filter(e => e.exception_type === '1')
      .map(e => e.service_id)

    const removedServiceIds = special
      .filter(e => e.exception_type === '2')
      .map(e => e.service_id)

    const date = helper.parseDate(dateStr)
    const weekOfDay = helper.getDayOfWeek(dateStr)

    const enabled = service.filter(e => {
      const startDate = helper.parseDate(e.start_date)
      const endDate = helper.parseDate(e.end_date)
      const flags = [
        e.monday === '1' && weekOfDay === '月',
        e.tuesday === '1' && weekOfDay === '火',
        e.wednesday === '1' && weekOfDay === '水',
        e.thursday === '1' && weekOfDay === '木',
        e.friday === '1' && weekOfDay === '金',
        e.saturday === '1' && weekOfDay === '土',
        e.sunday === '1' && weekOfDay === '日'
      ]
      return flags.some(f => f) && date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime()
    }).map(e => e.service_id)

    const validServiceIds = enabled.filter(id => !removedServiceIds.includes(id))
    const finalServiceIds = [...validServiceIds, ...addedServiceIds]

    return finalServiceIds
  },
  async findTrips (gtfsID, versionID, stopIDs) {
    const data = await Promise.all(stopIDs.map(e => Butter.getTimeTableByStopID(gtfsID, versionID, e)))
    const trips = data.map(x => new Set(x.map(y => y.trip_id)))
    const interSection = trips.reduce((prev, cur) => helper.setIntersection(prev, cur), trips.length > 0 ? trips[0] : new Set()) // TODO
    return [...interSection]
  },
  async findTimeTableByStopID (gtfsID, versionID, stopID, date) {
    const data = await Promise.all([
      Butter.getTimeTableByStopID(gtfsID, versionID, stopID),
      Butter.getServiceIDs(gtfsID, versionID, date)
    ])
    const timetable = data[0]
    const services = data[1]
    let ret = []
    for (const serviceID of services) {
      ret = ret.concat(
        timetable.filter(e => e.service_id === serviceID)
      )
    }
    return ret
  },
  async findTimeTableByTripIDs (gtfsID, versionID, TripIDs) {
    const data = await Promise.all(TripIDs.map(e => Butter.getTimeTableByTripID(gtfsID, versionID, e)))
    let ret = []
    for (const e of data) {
      ret = ret.concat(e)
    }
    return ret
  },
  async fetchTimeTableV1 (gtfsID, options, version = 'optional') {
    const optionSample = {
      // INDEX1
      stop_ids: ['出発するバス停のID', '目的地のバス停ID', '経由地のバス停ID'],
      // INDEX1-REQUIRED OPTION
      date: '20230101',
      // INDEX2
      trip_ids: [
        '取得したいバスのID'
      ],
      // FILTER1
      start_time: 'いつのバスからリストアップするか',
      // FILTER2
      end_time: 'いつまでのバスをリストアップするか',
      // TODO
      positions: [
        { lat: '', lon: '', r: '半径' }
      ]// 優先度低い
    }
    if (version === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      version = versionInfo.slice(-1)[0].version_id
    }
    let stop_times = []
    if (options.stop_ids) {
      if (!options.date) {
        throw new Error('date is required when stop_ids are selected')
      }
      const stopID = options.stop_ids[0]
      const constraints = options.stop_ids
      const data = await Promise.all([
        Butter.findTimeTableByStopID(gtfsID, version, stopID, options.date),
        Butter.findTrips(gtfsID, version, constraints)
      ])
      const tripSet = new Set(data[1].concat(options.trip_ids || []))
      const filtered = data[0].filter(e => tripSet.has(e.trip_id))
      for (const e of filtered) {
        let headsign = e.stop_headsign
        if (!headsign) {
          headsign = e.trip_headsign
        }
        stop_times.push({
          trip_id: e.trip_id,
          stop_id: e.stop_id,
          arrival_time: e.arrival_time,
          departure_time: e.departure_time,
          headsign,
          stop_headsign: e.stop_headsign,
          trip_headsign: e.trip_headsign,
          stop_name: e.stop_name,
          predict_time: 'NOT IMPLEMENTED'
        })
      }
    } else if (options.trip_ids) {
      const data = await Butter.findTimeTableByTripIDs(gtfsID, version, options.trip_ids)
      for (const e of data) {
        let headsign = e.stop_headsign
        if (!headsign) {
          headsign = e.trip_headsign
        }
        stop_times.push({
          trip_id: e.trip_id,
          stop_id: e.stop_id,
          arrival_time: e.arrival_time,
          departure_time: e.departure_time,
          headsign,
          stop_headsign: e.stop_headsign,
          trip_headsign: e.trip_headsign,
          stop_name: e.stop_name,
          predict_time: 'NOT IMPLEMENTED'
        })
      }
    } else {
      throw new Error('stop_ids or trip_ids are required')
    }
    if (options.start_time) {
      stop_times = stop_times.filter(e => e.arrival_time >= options.start_time)
    }
    if (options.end_time) {
      stop_times = stop_times.filter(e => e.arrival_time <= options.end_time)
    }
    stop_times = stop_times.sort((a, b) => {
      if (a.arrival_time < b.arrival_time) return -1
      if (a.arrival_time > b.arrival_time) return 1
      if (a.trip_id < b.trip_id) return -1
      if (a.trip_id > b.trip_id) return 1
      return 0
    })
    return {
      stop_times: Object.values(stop_times),
      properties: 'NOT IMPLEMENTED'
    }
  },
  async getStopsWithinRadius (lat, lon, radius) {
    const h3Index = h3.geoToH3(lat, lon, 7)
    // const neighboringH3Indexes = h3.kRing(h3Index, 1);

    const h3IndexesToSearch = [h3Index]
    // const h3IndexesToSearch = [h3Index, ...neighboringH3Indexes];
    const stopDataPromises = h3IndexesToSearch.map(index => {
      const url = `${RUNTIME.host}/byH3index/${index}_stops.csv`
      return axios.get(url)
    })

    const stopDataResponses = await Promise.allSettled(stopDataPromises)
    const stopData = stopDataResponses
      .filter(response => response.status === 'fulfilled')
      .map(response => response.value.data)

    const stops = stopData
      .flatMap(data => data.split('\n'))
      .slice(1)
      .map(line => {
        const [
          stop_id,
          stop_name,
          platform_code,
          stop_lat,
          stop_lon,
          zone_id,
          location_type,
          gtfs_id,
          stop_code,
          stop_desc,
          stop_url,
          parent_station,
          stop_timezone,
          wheelchair_boarding,
          level_id,
          h3index
        ] = line.split(',')

        return {
          stop_id,
          stop_name,
          platform_code,
          stop_lat: parseFloat(stop_lat),
          stop_lon: parseFloat(stop_lon),
          zone_id,
          location_type,
          gtfs_id,
          stop_code,
          stop_desc,
          stop_url,
          parent_station,
          stop_timezone,
          wheelchair_boarding,
          level_id,
          h3index
        }
      })

    const stopsWithinRadius = stops.filter(stop => {
      const start = { latitude: lat, longitude: lon }
      const end = { latitude: stop.stop_lat, longitude: stop.stop_lon }
      const distance = haversine(start, end, { unit: 'meter' })
      return distance <= radius
    })

    return stopsWithinRadius
  },
  async getStopsBySubstring (substring) {
    try {
      const url = `${RUNTIME.host}/n-gram/${encodeURIComponent(substring[0])}.csv`
      const response = await axios.get(url)

      if (response.status !== 200) {
        throw new Error('Failed to fetch data from URL.')
      }

      const data = response.data
      const lines = data.split('\n')
      const headers = lines[0].split(',')

      const stops = []

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue

        const values = lines[i].split(',')
        const stop = {}

        for (let j = 0; j < headers.length; j++) {
          stop[headers[j]] = values[j]
        }

        // stop_name に substring が含まれる場合のみ、結果に追加
        if (stop.stop_name.includes(substring)) {
          stops.push(stop)
        }
      }

      return stops
    } catch (error) {
      console.error(`Error fetching stops data: ${error.message}`)
      return []
    }
  },
  async getVehiclePositionFromURL (url) {
    // .protoファイルの内容を文字列として埋め込む
    console.log('protoStr', protoStr)

    // Protobuf Rootオブジェクトの作成
    const root = new protobuf.Root()
    // .proto文字列のパース
    protobuf.parse(protoStr.protoStr, root)

    // メッセージタイプの取得
    const FeedMessage = root.lookupType('transit_realtime.FeedMessage')

    // GTFS-RTデータの取得
    const resp = await fetch('https://cros-proxy.api.takoyaki3.com/' + url)
    const buffer = await resp.arrayBuffer()
    // Protobufメッセージのデコード
    const message = await FeedMessage.decode(new Uint8Array(buffer))

    // バスの位置情報の取得
    return message.entity
  },
  async getVehiclePositionUrls () {
    const url = `${RUNTIME.host}/datalist.json` // JSONデータが存在するURLを指定します
    const response = await fetch(url)
    const data = await response.json()

    const result = {}
    for (const item of data.data_list) {
      if (item.VehiclePosition_url) {
        result[item.gtfs_id] = item.VehiclePosition_url
      }
    }
    return result
  },
  async getBusInfo (latitude, longitude) {
    const vehiclePositionUrls = await this.getVehiclePositionUrls()

    // Convert latitude and longitude to H3 index
    const h3Index = h3.geoToH3(latitude, longitude, 7)

    try {
      const url = `${RUNTIME.host}/byH3index/${h3Index}_stops.csv`
      const response = await axios.get(url)

      if (response.status !== 200) {
        throw new Error('Failed to fetch data from URL.')
      }

      const data = response.data
      const lines = data.split('\n')
      const headers = lines[0].split(',')

      const gtfsIds = []

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue

        const values = lines[i].split(',')
        const stop = {}

        for (let j = 0; j < headers.length; j++) {
          stop[headers[j]] = values[j]
        }

        // Include the gtfs_id in the result if it's not already there
        if (!gtfsIds.includes(stop.gtfs_id)) {
          gtfsIds.push(stop.gtfs_id)
        }
      }

      const busInfos = []
      for (const gtfs_id of gtfsIds) {
        if (!(gtfs_id in vehiclePositionUrls)) continue
        const url = vehiclePositionUrls[gtfs_id]
        if (url === null) continue
        const busInfo = await this.getVehiclePositionFromURL(url)
        busInfos.push(busInfo)
      }
      return busInfos
    } catch (error) {
      console.error(`Error fetching bus info data: ${error.message}`)
      return []
    }
  },
  async getDataInfo (gtfs_id) {
    const dataList = await this.getHostDataList()
    for (const i in dataList) {
      if (dataList[i].gtfs_id === gtfs_id) return dataList[i]
    }
  },
  async init (butterRoot = 'https://butter.takoyaki3.com/v0.0.0/root.json') {
    await internal.setCA(butterRoot)
  },
  async getBusRealTimeInfo (obj) {
    const vehiclePositionUrls = await this.getVehiclePositionUrls()
    if (!(obj.gtfs_id in vehiclePositionUrls)) return []
    const url = vehiclePositionUrls[obj.gtfs_id]

    if (url === null) return []
    const busInfo = await this.getVehiclePositionFromURL(url)
    return busInfo
  },
  async getStopsForBusPassingThrough (gtfsId, stopId, versionId = 'optional') {
    if (versionId === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsId)
      versionId = versionInfo.slice(-1)[0].version_id
    }
    try {
      // 指定されたバス停を通るバスの時刻表を取得
      const stopTimes = await this.getTimeTableByStopID(gtfsId, versionId, stopId)

      // 各バスのトリップIDを取得
      const tripIDs = stopTimes.map(stopTime => stopTime.trip_id)

      // 重複を除去
      const uniqueTripIds = [...new Set(tripIDs)]

      // 各トリップIDに対して、バス停一覧を取得
      const stopsForTrips = await Promise.all(
        uniqueTripIds.map(tripId => this.getTimeTableByTripID(gtfsId, versionId, tripId))
      )

      const stops = []
      stopsForTrips.forEach(stopTimes => stops.push(...stopTimes.map(stopTime => stopTime.stop_id)))
      return [...new Set(stops)]
    } catch (error) {
      throw error
    }
  }
}

// module.exports = Butter;
export default Butter
