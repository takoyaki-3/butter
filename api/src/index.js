import Butter from '../../lib/dist'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'GET') {
    return new Response('Only GET requests are allowed', { status: 405 });
  }

  /* 各関数におけるパラメータ型の変換用構造体 */
  const functionParams = {
    addNumbers: ['a','b'], // この関数の正確なパラメータが不明です
    getHostUpdated: [],
    getComsumedOp: [],
    getHostDataList: [],
    getAgencyInfo: ['gtfsID'],
    getVersionId: ['gtfsID', 'versionID'],
    getVersionInfo: ['gtfsID', 'versionID'],
    getBusStops: ['gtfsID', 'versionID'],
    getAgency: ['gtfsID', 'versionID'],
    getCalendar: ['gtfsID', 'versionID'],
    getCalendarDates: ['gtfsID', 'versionID'],
    getFareAttributes: ['gtfsID', 'versionID'],
    getFareRules: ['gtfsID', 'versionID'],
    getFeedInfo: ['gtfsID', 'versionID'],
    getOfficeJp: ['gtfsID', 'versionID'],
    getRoutes: ['gtfsID', 'versionID'],
    getShapes: ['gtfsID', 'versionID'],
    getStopTimes: ['gtfsID', 'versionID'],
    getTransfers: ['gtfsID', 'versionID'],
    getTranslations: ['gtfsID', 'versionID'],
    getTrips: ['gtfsID', 'versionID'],
    getTimeTableByStopHash: ['gtfsID', 'versionID', 'stopHash'],
    getTimeTableByTripHash: ['gtfsID', 'versionID', 'tripHash'],
    getTimeTableByStopID: ['gtfsID', 'versionID', 'stopID'],
    getTimeTableByTripID: ['gtfsID', 'versionID', 'tripID'],
    getServiceIDs: ['gtfsID', 'versionID', 'dateStr'],
    findTrips: ['gtfsID', 'versionID', 'stopIDs'],
    findTimeTableByStopID: ['gtfsID', 'versionID', 'stopID', 'date'],
    findTimeTableByTripIDs: ['gtfsID', 'versionID', 'TripIDs'],
    fetchTimeTableV1: ['gtfsID', 'options', 'version'],
    getStopsWithinRadius: ['lat', 'lon', 'radius'],
    getStopsBySubstring: ['substring'],
    getVehiclePositionFromURL: ['url'],
    getVehiclePositionUrls: [],
    getBusInfo: ['latitude', 'longitude'],
    getDataInfo: ['gtfs_id'],
    init: ['butterRoot', 'config'],
    getBusRealTimeInfo: [],
    getStopsForBusPassingThrough: ['gtfsId', 'stopId', 'versionId'],
  };  

  try {
    const url = new URL(request.url);
    const functionName = url.pathname.split('/').pop();
    console.log('functionName', url.searchParams)
    const paramsObj = Object.fromEntries(url.searchParams);
    console.log('paramsObj', JSON.stringify(paramsObj))
    console.log('functionParams', JSON.stringify(functionParams[functionName]))
    const params = functionParams[functionName].map(param => paramsObj[param]);
    console.log((JSON.stringify({ functionName, params })));

    // BuTTERライブラリの初期化
    await Butter.init('https://butter.takoyaki3.com/v0.0.0/root.json', { useFetch: true });

    // 指定されたBuTTER関数の実行
    if (functionName in Butter) {
      console.log(Butter[functionName]);
      const result = await Butter[functionName](...params);
      console.log({ result });
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Function not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
