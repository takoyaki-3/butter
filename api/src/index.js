import Butter from '../../lib/dist'
import { functionParams, functionParamIsJSON } from './functionParams.js';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'GET') {
    return new Response('Only GET requests are allowed', { status: 405 });
  }

  // https://api.butter.takoyaki3.com/getShapes?gtfs_id=ToeiBus

  try {
    const url = new URL(request.url);
    const functionName = url.pathname.split('/').pop();
    // console.log('functionName', url.searchParams)
    const paramsObj = Object.fromEntries(url.searchParams);
    // console.log('paramsObj', JSON.stringify(paramsObj))
    // console.log('functionParams', JSON.stringify(functionParams[functionName]))
    const params = functionParams[functionName].map((param,index) => (param && functionParamIsJSON[functionName][index]) ? JSON.parse(paramsObj[param]) : paramsObj[param]);
    console.log({ functionName, params });
    console.log( JSON.stringify(params));

    // BuTTERライブラリの初期化
    await Butter.init('https://butter.takoyaki3.com/v0.0.0/root.json', { useFetch: true });

    // 指定されたBuTTER関数の実行
    if (functionName in Butter) {
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
