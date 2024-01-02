const axios = require('axios');

const functionParams = {
  addNumbers: ['a','b'],
  getHostUpdated: [],
  getComsumedOp: [],
  getHostDataList: [],
  getAgencyInfo: ['gtfs_id'],
  getVersionId: ['gtfs_id', 'version_id'],
  getVersionInfo: ['gtfs_id', 'version_id'],
  getBusStops: ['gtfs_id', 'version_id'],
  getAgency: ['gtfs_id', 'version_id'],
  getCalendar: ['gtfs_id', 'version_id'],
  getCalendarDates: ['gtfs_id', 'version_id'],
  getFareAttributes: ['gtfs_id', 'version_id'],
  getFareRules: ['gtfs_id', 'version_id'],
  getFeedInfo: ['gtfs_id', 'version_id'],
  getOfficeJp: ['gtfs_id', 'version_id'],
  getRoutes: ['gtfs_id', 'version_id'],
  getShapes: ['gtfs_id', 'version_id'],
  // getStopTimes: ['gtfs_id', 'version_id'], // 都営バスの場合、大きすぎてエラーとなる
  // getTransfers: ['gtfs_id', 'version_id'], // 都営バスの場合、存在しないためエラーとなる
  getTranslations: ['gtfs_id', 'version_id'],
  // getTrips: ['gtfs_id', 'version_id'],
  // getTimeTableByStopHash: ['gtfs_id', 'version_id', 'stop_hash'],
  // getTimeTableByTripHash: ['gtfs_id', 'version_id', 'trip_hash'],
  getTimeTableByStopID: ['gtfs_id', 'version_id', 'stop_id'],
  // getTimeTableByTripID: ['gtfs_id', 'version_id', 'trip_id'],
  getServiceIDs: ['gtfs_id', 'version_id', 'date'],
  findTrips: ['gtfs_id', 'version_id', 'stop_ids'], // 都営バスの場合、大きすぎてエラーとなる
  findTimeTableByStopID: ['gtfs_id', 'version_id', 'stop_id', 'date'],
  findTimeTableByTripIDs: ['gtfs_id', 'version_id', 'trip_ids'],
  // fetchTimeTableV1: ['gtfs_id', 'options', 'version'],
  getStopsWithinRadius: ['lat', 'lon', 'radius'],
  getStopsBySubstring: ['substring'],
  // getVehiclePositionFromURL: ['url'],
//  getVehiclePositionUrls: [],
  // getBusInfo: ['lat', 'lon'],
  // getDataInfo: ['gtfs_id'],
  // init: ['butter_root', 'config'],
  // getBusRealTimeInfo: [],
//  getStopsForBusPassingThrough: ['gtfs_id', 'stop_id', 'version_id'], // リクエスト数が多すぎるため失敗する
};

const sampleParams = {
  a: 1,
  b: 2,
  gtfs_id: 'ToeiBus',
  version_id: undefined,
  stop_hash: 'aa',
  trip_hash: 'aa',
  substring: '東京国際',
  stop_id: '0605-07',
  trip_id: '00106-1-01-105-0913',
  lat: 35.693906,
  lon: 139.701504,
  radius: 100,
  date: 20240131,
  stop_ids: ['0605-07'],
  trip_ids: ['00106-1-01-105-0913'],
}

const main = async () => {
  const results = []
  for(const functionName in functionParams) {
    const params = functionParams[functionName].filter(param => sampleParams[param]!==undefined);
    const url = `http://localhost:8787/v1/${functionName}?${params.map(param => `${param}=${(typeof(sampleParams[param]) === 'object' || typeof(sampleParams[param]) === 'array') ? JSON.stringify(sampleParams[param]) : sampleParams[param]}`).join('&')}`
    try {
      const response = await axios.get(url)
      // results.push({ functionName, params, response: response.data })
      console.log(url)
      console.log(response.data)
    } catch (error) {
      console.log(error)
      results.push({ functionName, error, url })
    }
  }
  results.forEach(result => console.log(result))
}

main();