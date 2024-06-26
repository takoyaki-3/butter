// src/index.js
// Top level file is just a mixin of submodules & constants
import { ButterInternal } from './internal.js'
const protobuf = require('./gtfs-rt_pb.js');

const h3 = require('h3-js/legacy')
const haversine = require('haversine')
// const protobuf = require('protobufjs')
// const protoStr = require('./gtfs-realtime.proto.js')

const helperLib = require('./helper.js')
const helper = helperLib.helper

const defaultButterRootV0 = 'https://butter.takoyaki3.com/v0.0.0/root.json'
const defaultButterRootV1 = 'https://butter.takoyaki3.com/v1.0.0/root.json'

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
    await internal.waitCAReady()
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
    console.log('getHostDataList')
    await internal.waitCAReady()
    console.log('waitCAReady')
    const data = await helper.fetchJSON(`${internal.RUNTIME.host}/datalist.json`, internal.RUNTIME.pub_key)
    return data.data_list
  },
  async getAgencyInfo (gtfsID) {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${internal.RUNTIME.host}/${gtfsID}/info.json`, internal.RUNTIME.pub_key)
    return data
  },
  async getVersionId (gtfsID, versionID) {
    await internal.waitCAReady()
    if (!versionID) {
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
  async getVersionInfo (gtfsID, versionID) {
    await internal.waitCAReady()
    if (!versionID) {
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
  async getBusStops (gtfsID, versionID) {},
  /**
   * GTFSの事業者情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 事業者情報。
   * */
  async getAgency (gtfsID, versionID) {},
  /**
   * GTFSのカレンダー情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - カレンダー情報。
   */
  async getCalendar (gtfsID, versionID) {},
  /**
   * GTFSのカレンダー日付情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - カレンダー日付情報。
   */
  async getCalendarDates (gtfsID, versionID) {},
  /**
   * GTFSの運賃属性情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 運賃属性情報。
   */
  async getFareAttributes (gtfsID, versionID) {},
  /**
   * GTFSの運賃ルール情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 運賃ルール情報。
   */
  async getFareRules (gtfsID, versionID) {},
  /**
   * GTFSのフィード情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - フィード情報。
   */
  async getFeedInfo (gtfsID, versionID) {},
  /**
   * GTFSの事業者情報（日本語）を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 事業者情報（日本語）。
   */
  async getOfficeJp (gtfsID, versionID) {},
  /**
   * GTFSの路線情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 路線情報。
   */
  async getRoutes (gtfsID, versionID) {},
  /**
   * GTFSのシェイプ情報を取得します．
   * @param {string} gtfsID - GTFSのID
   * @param {string} [versionID='optional'] - バージョンID
   * @returns {Promise<Object>} - シェイプ情報
   */
  async getShapes (gtfsID, versionID) {},
  /**
   * GTFSの停留所時刻情報を取得します．
   * @param {string} gtfsID - GTFSのID
   * @param {string} [versionID='optional'] - バージョンID
   * @returns {Promise<Object>} - 停留所時刻情報
   */
  async getStopTimes (gtfsID, versionID) {},
  /**
   * GTFSの乗り換え情報を取得します．
   * @param {string} gtfsID - GTFSのID
   * @param {string} [versionID='optional'] - バージョンID
   * @returns {Promise<Object>} - 乗り換え情報
   */
  async getTransfers (gtfsID, versionID) {},
  /**
   * GTFSの翻訳情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns {Promise<Object>} - 翻訳情報。
   */
  async getTranslations (gtfsID, versionID) {},
  /**
   *  GTFSのトリップ情報を取得します．
   * @param {string} gtfsID - GTFSのID。
   * @param {string} [versionID='optional'] - バージョンID。
   * @returns  {Promise<Object>} - トリップ情報。
   */
  async getTrips (gtfsID, versionID) {},

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
    await internal.waitCAReady()
    const versionInfo = await Butter.getVersionInfo(gtfsID, versionID)
    // console.log({ versionInfo })
    const stopHash = await helper.hash.v2(stopID, versionInfo.by_stop_hash_value_size)
    // console.log({ stopHash })
    const timeTables = await Butter.getTimeTableByStopHash(gtfsID, versionID, stopHash)
    // console.log({ timeTables })
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
    await internal.waitCAReady()
    const versionInfo = await Butter.getVersionInfo(gtfsID, versionID)
    const tripHash = await helper.hash.v2(tripID, versionInfo.by_trip_hash_value_size)
    const timeTables = await Butter.getTimeTableByTripHash(gtfsID, versionID, tripHash)
    return timeTables[tripID]
  },

  async getServiceIDs (gtfsID, versionID, dateStr) {
    await internal.waitCAReady()
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
    const data = []
    for (const stopID of stopIDs) {
      data.push(await Butter.getTimeTableByStopID(gtfsID, versionID, stopID))
    }
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
    await internal.waitCAReady()
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

  async fetchTimeTableV1 (gtfsID, options, version) {
    await internal.waitCAReady()
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
    if (!version) {
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
    try {
      await internal.waitCAReady()
      const h3Index = h3.geoToH3(lat, lon, 7)

      console.log('h3Index', h3Index)
      console.log('lat', lat, 'lon', lon, 'radius', radius)

      const url = `${internal.RUNTIME.host}/byH3index/${h3Index}_stops.csv`
      console.log({url})
      const stopData = await helper.fetchCSV(url, internal.RUNTIME.pub_key)

      const stops = stopData

      const stopsWithinRadius = stops.filter(stop => {
        const start = { latitude: lat, longitude: lon }
        const end = { latitude: stop.stop_lat, longitude: stop.stop_lon }
        const distance = haversine(start, end, { unit: 'meter' })
        return distance <= radius
      })

      return stopsWithinRadius
    } catch (error) {
      console.log(`no stops data: ${error.message}`)
      return []
    }
  },
  async getStopsBySubstring (substring) {
    await internal.waitCAReady()
    try {
      const url = `${internal.RUNTIME.host}/n-gram/${encodeURIComponent(substring[0])}.csv`
      const csvData = await helper.fetchCSV(url)

      const stops = []

      for (const record of csvData) {
        // stop_name に substring が含まれる場合のみ、結果に追加
        if (record.stop_name && record.stop_name.includes(substring)) {
          stops.push(record)
        }
      }

      return stops
    } catch (error) {
      console.error(`Error fetching stops data: ${error.message}`)
      return []
    }
  },
  async getVehiclePositionFromURL (url) {
    await internal.waitCAReady();

    try {
      // GTFS-RTデータの取得
      url = 'https://cros-proxy.butter.takoyaki3.com/' + url
      console.log('url', url)
      const data = await helper.fetchAsArrayBuffer(url)

      // Protobufメッセージのデコード
      const message = protobuf.FeedMessage.deserializeBinary(new Uint8Array(data));
      const entity = message.toObject();

      // バスの位置情報の取得
      return entity.entityList;
    } catch (error) {
      console.error('Error fetching vehicle position data:', error);
      throw error;
    }
  },
  async getVehiclePositionUrls () {
    await internal.waitCAReady()
    const url = `${internal.RUNTIME.host}/datalist.json` // JSONデータが存在するURLを指定

    try {
      const data = await helper.fetchJSON(url)
      const result = {}

      for (const item of data.data_list) {
        if (item.VehiclePosition_url) {
          result[item.gtfs_id] = item.VehiclePosition_url
        }
      }

      return result
    } catch (error) {
      console.error('Error fetching vehicle position URLs:', error)
      throw error
    }
  },
  async getBusInfo (latitude, longitude) {
    await internal.waitCAReady()
    const vehiclePositionUrls = await this.getVehiclePositionUrls()

    // Convert latitude and longitude to H3 index
    const h3Index = h3.geoToH3(latitude, longitude, 7)

    try {
      const url = `${internal.RUNTIME.host}/byH3index/${h3Index}_stops.csv`

      const data = await helper.fetchCSV(url)
      console.log(data.length)
      if(!data) return []

      const gtfsIds = []

      data.forEach(stop => {
        if (!gtfsIds.includes(stop.gtfs_id)) {
          gtfsIds.push(stop.gtfs_id)
        }
      })

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
  async init (butterRoot = defaultButterRootV0, config = { useFetch: false, version: 'v0.0.0'}) {
    helper.setUseFetch(config.useFetch)

    if (config.version === 'v0.0.0' || butterRoot !== defaultButterRootV0) {
      // Load ButterRoot v0.0.0
      internal = new ButterInternal(butterRoot)
    } else {
      // Load ButterRoot v1.0.0
      internal = new ButterInternal(defaultButterRootV1)
    }
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
      return async (gtfsID, versionID) => {
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
  async getStopsForBusPassingThrough (gtfsId, stopId, versionId) {
    await internal.waitCAReady()
    if (!versionId) {
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
  },
  async getRealTimePositionsByGtfsId (gtfsId) {
    await internal.waitCAReady()
    try {
      const vehiclePositionUrls = await this.getVehiclePositionUrls()
      if (!(gtfsId in vehiclePositionUrls)) return []
      const url = vehiclePositionUrls[gtfsId]

      if (!url) return []
      console.log('url', url)
      const busInfo = await this.getVehiclePositionFromURL(url)
      const busInfo2 = busInfo.map(e => {
        return {
          gtfs_id: gtfsId,
          ...e
        }
      })
      const busInfo3 = busInfo2.map(e => helper.convertKeysToSnakeCase(e))
      return busInfo3
    } catch (error) {
      console.error(`Error fetching bus info data: ${gtfsId} ${error.message}`)
      return []
    }
  },
  async getRealTimePositionsByLatLon (latitude, longitude) {
    await internal.waitCAReady()

    // Convert latitude and longitude to H3 index
    const h3Index = h3.geoToH3(latitude, longitude, 7)

    try {
      const url = `${internal.RUNTIME.host}/byH3index/${h3Index}_stops.csv`

      const data = await helper.fetchJSON(url)
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
      for (const gtfsId of gtfsIds) {
        const vehiclePositionUrls = await this.getVehiclePositionUrls()
        if (!(gtfsId in vehiclePositionUrls)) continue
        const url = vehiclePositionUrls[gtfsId]
        if (url === null) continue
        const busInfo = await this.getVehiclePositionFromURL(url)
        busInfos.push(...busInfo)
      }
      return busInfos
    } catch (error) {
      console.error(`Error fetching bus info data: ${error.message}`)
      return []
    }
  },
}

// module.exports = Butter;
export default Butter
