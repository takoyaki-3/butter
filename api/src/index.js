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

  console.log(method,options)

  if (method == 'fetchTimeTableV1') {
    const tt = await butter.fetchTimeTableV1(gtfsID, JSON.parse(options))
    return new Response(JSON.stringify(tt), {
      headers: { 'content-type': 'text/plain' },
    })  
  } else if (method == 'getStopsWithinRadiusV1') {
    const tt = await butter.getStopsWithinRadius(lat,lon,radius)
    return new Response(JSON.stringify(tt), {
      headers: { 'content-type': 'text/plain' },
    })
  } else if (method == 'getStopsBySubstringV1') {
    const tt = await butter.getStopsBySubstring(name)
    return new Response(JSON.stringify(tt), {
      headers: { 'content-type': 'text/plain' },
    })
  }

  return new Response("hello, butter !", {
    headers: { 'content-type': 'text/plain' },
  })
}
