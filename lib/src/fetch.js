// src/index.js
// Top level file is just a mixin of submodules & constants
import { ButterInternal } from './internal.js'

const h3 = require('h3-js/legacy')
const axios = require('axios')
const haversine = require('haversine')
const protobuf = require('protobufjs')
const protoStr = require('./gtfs-realtime.proto.js')

const helperLib = require('./helper.js')
const helper = helperLib.helper

/**
 * 2つの数値を加算します。
 * @param {number} a - 最初の数値。
 * @param {number} b - 2番目の数値。
 * @returns {number} - 加算された結果。
 */
function addNumbers (a, b) {
  return a + b
}

let internal = null // ButterInternalオブジェクトを格納する変数

const Butter = {
  addNumbers,
  async getHostUpdated () {
    const hostList = []

    for (let i = 0; i < internal.RUNTIME.CA.hosts.length; i++) {
      const host = internal.RUNTIME.CA.hosts[i]
      let updated

      try { // ホストからのデータ取得を試みる
        const data = await helper.fetchJSON(`${host}/datalist.json`, internal.RUNTIME.pub_key)

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
    const data = await helper.fetchJSON(`${internal.RUNTIME.host}/datalist.json`, internal.RUNTIME.pub_key)
    return data.data_list
  },
  async getAgencyInfo (gtfsID) {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${internal.RUNTIME.host}/${gtfsID}/info.json`, internal.RUNTIME.pub_key)
    return data
  },
  async getVersionId (gtfsID, versionID) {
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      return versionInfo.slice(-1)[0].version_id
    }
    return versionID
  },
  /**
   * GTFSのバージョン情報を取得します。
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - バージョン情報。
   */
  async getVersionInfo (gtfsID, versionID = 'optional') {
    await internal.waitCAReady()
    if (versionID === 'optional') {
      const versionInfo = await Butter.getAgencyInfo(gtfsID)
      versionID = versionInfo.slice(-1)[0].version_id
    }
    const data = await helper.fetchJSON(`${internal.RUNTIME.host}/${gtfsID}/${versionID}/info.json`, internal.RUNTIME.pub_key)
    return data
  },
  /**
   * GTFSのバス停の情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - バス停の情報。
   */
  async getBusStops (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの事業者情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 事業者情報。
   * */
  async getAgency (gtfsID, versionID = 'optional') {},
  /**
   * GTFSのカレンダー情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - カレンダー情報。
   */
  async getCalendar (gtfsID, versionID = 'optional') {},
  /**
   * GTFSのカレンダー日付情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - カレンダー日付情報。
   */
  async getCalendarDates (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの運賃属性情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 運賃属性情報。
   */
  async getFareAttributes (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの運賃ルール情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 運賃ルール情報。
   */
  async getFareRules (gtfsID, versionID = 'optional') {},
  /**
   * GTFSのフィード情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - フィード情報。
   */
  async getFeedInfo (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの事業者情報（日本語）を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 事業者情報（日本語）。
   */
  async getOfficeJp (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの路線情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 路線情報。
   */
  async getRoutes (gtfsID, versionID = 'optional') {},
  /**
   * GTFSのシェイプ情報を取得します．
   * @param {string} gtfsID - GTFSのID
   * @param {string} [versionID='optional'] - バージョンID
   * @returns {Promise<Object>} - シェイプ情報
   */
  async getShapes (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの停留所時刻情報を取得します．
   * @param {string} gtfsID - GTFSのID
   * @param {string} [versionID='optional'] - バージョンID
   * @returns {Promise<Object>} - 停留所時刻情報
   */
  async getStopTimes (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの乗り換え情報を取得します．
   * @param {string} gtfsID - GTFSのID
   * @param {string} [versionID='optional'] - バージョンID
   * @returns {Promise<Object>} - 乗り換え情報
   */
  async getTransfers (gtfsID, versionID = 'optional') {},
  /**
   * GTFSの翻訳情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 翻訳情報。
   */
  async getTranslations (gtfsID, versionID = 'optional') {},
  /**
   *  GTFSのトリップ情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns  {Promise<Object>} - トリップ情報。
   */
  async getTrips (gtfsID, versionID = 'optional') {},

  /**
   * ストップハッシュによる時刻表を取得します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {string} stopHash - ストップハッシュ。
   * @returns {Promise<Object>} フェッチしたデータ。
   */
  async getTimeTableByStopHash (gtfsID, versionID, stopHash) {
    await internal.waitCAReady()
    versionID = await Butter.getVersionId(gtfsID, versionID)
    const data = await helper.fetchTarCSV(`${internal.RUNTIME.host}/${gtfsID}/${versionID}/byStops/${stopHash}.tar.gz`, internal.RUNTIME.pub_key)
    return data
  },

  /**
   * トリップハッシュによる時刻表を取得します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {string} tripHash - トリップハッシュ。
   * @returns {Promise<Object>} フェッチしたデータ。
   */
  async getTimeTableByTripHash (gtfsID, versionID, tripHash) {
    await internal.waitCAReady()
    versionID = await Butter.getVersionId(gtfsID, versionID)
    const data = await helper.fetchTarCSV(`${internal.RUNTIME.host}/${gtfsID}/${versionID}/byTrips/${tripHash}.tar.gz`, internal.RUNTIME.pub_key)
    return data
  },

  /**
   * ストップIDによる時刻表を取得します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {string} stopID - ストップID。
   * @returns {Promise<Object>} 指定したストップIDの時刻表。
   */
  async getTimeTableByStopID (gtfsID, versionID, stopID) {
    const versionInfo = await Butter.getVersionInfo(gtfsID, versionID)
    console.log({ versionInfo })
    const stopHash = await helper.hash.v2(stopID, versionInfo.by_stop_hash_value_size)
    console.log({ stopHash })
    const timeTables = await Butter.getTimeTableByStopHash(gtfsID, versionID, stopHash)
    return timeTables[stopID]
  },

  /**
   * トリップIDによる時刻表を取得します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {string} tripID - トリップID。
   * @returns {Promise<Object>} 指定したトリップIDの時刻表。
   */
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
  /**
   * 指定したストップIDのトリップを検索します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {Array<string>} stopIDs - ストップIDの配列。
   * @returns {Promise<Array<string>>} 交差するトリップIDの配列。
   */
  async findTrips (gtfsID, versionID, stopIDs) {
    const data = await Promise.all(stopIDs.map(e => Butter.getTimeTableByStopID(gtfsID, versionID, e)))
    const trips = data.map(x => new Set(x.map(y => y.trip_id)))
    const interSection = trips.reduce((prev, cur) => helper.setIntersection(prev, cur), trips.length > 0 ? trips[0] : new Set())
    // TODO コーナーケースの検討
    return [...interSection]
  },

  /**
   * 指定した日付のストップIDによる時刻表を検索します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {string} stopID - ストップID。
   * @param {string} date - 日付。
   * @returns {Promise<Array<Object>>} 指定したストップIDと日付の時刻表。
   */
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

  /**
   * トリップIDによる時刻表を検索します。
   * @async
   * @param {string} gtfsID - GTFSのID。
   * @param {string} versionID - バージョンID。
   * @param {Array<string>} TripIDs - トリップIDの配列。
   * @returns {Promise<Array<Object>>} 指定したトリップIDの時刻表。
   */
  async findTimeTableByTripIDs (gtfsID, versionID, TripIDs) {
    const data = await Promise.all(TripIDs.map(e => Butter.getTimeTableByTripID(gtfsID, versionID, e)))
    let ret = []
    for (const e of data) {
      ret = ret.concat(e)
    }
    return ret
  },

  async fetchTimeTableV1 (gtfsID, options, version = 'optional') {
    // const optionSample = {
    //   // INDEX1
    //   stop_ids: ['出発するバス停のID', '目的地のバス停ID', '経由地のバス停ID'],
    //   // INDEX1-REQUIRED OPTION
    //   date: '20230101',
    //   // INDEX2
    //   trip_ids: [
    //     '取得したいバスのID'
    //   ],
    //   // FILTER1
    //   start_time: 'いつのバスからリストアップするか',
    //   // FILTER2
    //   end_time: 'いつまでのバスをリストアップするか',
    //   // TODO 距離・位置に関する処理
    //   positions: [
    //     { lat: '', lon: '', r: '半径' }
    //   ]// 優先度低い
    // }
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
      const url = `${internal.RUNTIME.host}/byH3index/${index}_stops.csv`
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
      const url = `${internal.RUNTIME.host}/n-gram/${encodeURIComponent(substring[0])}.csv`
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
    const url = `${internal.RUNTIME.host}/datalist.json` // JSONデータが存在するURLを指定します
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
      const url = `${internal.RUNTIME.host}/byH3index/${h3Index}_stops.csv`
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
  /**
   * 初期化処理を行います。
   */
  async init (butterRoot = 'https://butter.takoyaki3.com/v0.0.0/root.json') {
    internal = new ButterInternal(butterRoot)
    /**
     * getXXX系の関数は同一の処理なので，ディクショナリを用いて一括で定義する
     */
    const urls = {
      getBusStops: 'GTFS/stops.txt',
      getAgency: 'GTFS/agency.txt',
      getCalendar: 'GTFS/calendar.txt',
      getCalendarDates: 'GTFS/calendar_dates.txt',
      getFareAttributes: 'GTFS/fare_attributes.txt',
      getFareRules: 'GTFS/fare_rules.txt',
      getFeedInfo: 'GTFS/feed_info.txt',
      getOfficeJp: 'GTFS/office_jp.txt',
      getRoutes: 'GTFS/routes.txt',
      getShapes: 'GTFS/shapes.txt',
      getStopTimes: 'GTFS/stop_times.txt',
      getTransfers: 'GTFS/transfers.txt',
      getTranslations: 'GTFS/translations.txt',
      getTrips: 'GTFS/trips.txt'
    }
    // https://butter.oozora283.com/ToeiBus/2023-12-20T11_34_38Z_00/info.json

    /**
     * getXXX系の関数を生成するための関数
     * @param {string} target - 生成する関数の名前
     * @returns {function} - 生成された関数
     */
    const getFactory = (target) => {
      return async (gtfsID, versionID = 'optional') => {
        await internal.waitCAReady()
        versionID = await Butter.getVersionId(gtfsID, versionID)
        const data = await helper.fetchCSV(`${internal.RUNTIME.host}/${gtfsID}/${versionID}/${urls[target]}`, internal.RUNTIME.pub_key)
        return data
      }
    }
    for (const key in urls) {
      Butter[key] = getFactory(key)
    }
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
  }
}

// module.exports = Butter;
export default Butter
