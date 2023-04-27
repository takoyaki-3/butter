import { ungzip } from 'pako';
const tool = require('./helper/tool.js');

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const urlParams = new URL(request.url).searchParams;
  const targetFileName = urlParams.get('file'); // リクエストパラメータからファイル名を取得

  const url = 'http://pub-ad1f4a48b8ef46779b720e734b0c2e1d.r2.dev/v0.0.0/ToeiBus/2023-04-16T09_12_29Z_00/byStops/00.tar.gz';
  const files = await tool.getFilesFromTarGzURL(url)

  let text = 'Tar files extracted. but [' + targetFileName + '] not found.';

  // ファイル名とデータを出力
  files.forEach(file => {
    if (file.name === targetFileName) { // リクエストパラメータで指定されたファイル名と一致する場合
      // console.log(`File: ${file.name}`)
      // console.log(`Data: ${file.data}`)

      text = (new TextDecoder).decode(new Uint8Array(file.data))
    }
  })

  const data = await tool.getBinaryFromURL('https://pub-ad1f4a48b8ef46779b720e734b0c2e1d.r2.dev/v0.0.0/ToeiBus/info.json')
  console.log("json:",(data))

  return new Response(data, {
    headers: { 'content-type': 'text/plain' },
  })
}
