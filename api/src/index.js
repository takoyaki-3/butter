import { ungzip } from 'pako';
// const tool = require('./helper/tool.js');
const butter = require('./helper/butter.js');

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const urlParams = new URL(request.url).searchParams;
  
  // リクエストパラメータから取得
  const method = urlParams.get('method');

  // 
  const gtfsID = urlParams.get('gtfsID');
  const options = urlParams.get('options');
  const lat = urlParams.get('lat');
  const lon = urlParams.get('lon');
  const radius = urlParams.get('radius');
  const name = urlParams.get('name');

  await butter.init()

  if (method == 'fetchTimeTableV1') {
    const tt = await butter.fetchTimeTableV1(gtfsID, JSON.parse(options))
    return new Response(JSON.stringify(tt), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }) 
  } else if (method == 'fetchStopsV1') {
    const tt = await butter.fetchStopsV1(lat,lon,radius,name)
    return new Response(JSON.stringify(tt), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } else if (method == 'dataListV1') {
    const tt = await butter.getHostDataList()
    return new Response(JSON.stringify({data_list:tt}), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }) 
  }

  return new Response("hello, butter !", {
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// https://butter.hatano-yuuta7921.workers.dev/?method=fetchTimeTableV1&gtfs_id=ToeiBus&options={%22date%22:%2220240320%22,%22stop_ids%22:[%220605-07%22]}
// https://butter.hatano-yuuta7921.workers.dev/?method=fetchTimeTableV1&gtfsID=ToeiBus&options=%7B%22date%22:%2220240320%22,%22stop_ids%22:[%220087-02%22]%7D
// https://butter.hatano-yuuta7921.workers.dev/?method=fetchTimeTableV1&gtfsID=ToeiBus&options={%22stop_ids%22:[%220605-07%22
