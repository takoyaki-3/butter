import Butter from '../../lib/dist'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Only POST requests are allowed', { status: 405 });
  }

  try {
    // リクエストのJSONボディを解析
    const { functionName, params } = await request.json();

    // // const response = await fetch('https://butter.takoyaki3.com/v0.0.0/root.json'); // ここにデータを取得したいURLを入れます
    // const response = await fetch('https://butter.oozora283.com/ToeiBus/info.json'); // ここにデータを取得したいURLを入れます
    // if (!response.ok) {
    //   console.log({json:JSON.stringify(response)});
    //   throw new Error('ネットワークレスポンスが不正です。');
    // }
    // const data = await response.json();
    // console.log(data); // ここで取得したデータを扱います
    // return new Response(JSON.stringify(data), {
    //   headers: { 'Content-Type': 'application/json' },
    // });

    // BuTTERライブラリの初期化
    await Butter.init('https://butter.takoyaki3.com/v0.0.0/root.json',{useFetch: true});
    console.log(Butter);

    // 指定されたBuTTER関数の実行
    if (functionName in Butter) {
      console.log(Butter[functionName])
      const result = await Butter[functionName](...params);
      console.log({result});
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
    console.log(error)
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

// https://butter.hatano-yuuta7921.workers.dev/?method=fetchTimeTableV1&gtfsID=ToeiBus&options={%22date%22:%2220240320%22,%22stop_ids%22:[%220605-07%22]}
// https://butter.hatano-yuuta7921.workers.dev/?method=fetchTimeTableV1&gtfsID=ToeiBus&options=%7B%22date%22:%2220240320%22,%22stop_ids%22:[%220087-02%22]%7D
// https://butter.hatano-yuuta7921.workers.dev/?method=fetchTimeTableV1&gtfsID=ToeiBus&options={%22stop_ids%22:[%220605-07%22

// http://192.168.0.2:8787/?method=fetchTimeTableV1&gtfsID=ToeiBus&options=%7B%22date%22:%2220240320%22,%22stop_ids%22:[%220605-03%22]%7D
// http://192.168.0.2:8787/?method=fetchTimeTableV1&gtfsID=ToeiBus&options={%22date%22:%2220240320%22,%22stop_ids%22:[%220605-03%22]}
// http://192.168.0.2:8787/?method=fetchTimeTableV1&gtfsID=ToeiBus&options={%22stop_ids%22:[%220605-03%22],%22date%22:%2220240302%22}
