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
  const options = urlParams.get('json');

  await butter.init()

  console.log(options)

  if (method == 'fetchTimeTableV1') {
    const tt = await butter.fetchTimeTableV1(gtfsID, JSON.parse(options))
    return new Response(JSON.stringify(tt), {
      headers: { 'content-type': 'text/plain' },
    })  
  }

  return new Response("hello, butter !", {
    headers: { 'content-type': 'text/plain' },
  })
}
