import { ungzip } from 'pako';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const urlParams = new URL(request.url).searchParams;
  const targetFileName = urlParams.get('file'); // リクエストパラメータからファイル名を取得

  const tarBinary = await getTarBinary(request)
  const files = await untar(tarBinary)

  let text = 'Tar files extracted. but [' + targetFileName + '] not found.';

  // ファイル名とデータを出力
  files.forEach(file => {
    if (file.name === targetFileName) { // リクエストパラメータで指定されたファイル名と一致する場合
      console.log(`File: ${file.name}`)
      console.log(`Data: ${file.data}`)

      text = (new TextDecoder).decode(new Uint8Array(file.data))
    }
  })

  return new Response(text, {
    headers: { 'content-type': 'text/plain' },
  })
}

async function getTarBinary(request) {
  const url = 'http://pub-ad1f4a48b8ef46779b720e734b0c2e1d.r2.dev/v0.0.0/ToeiBus/2023-04-16T09_12_29Z_00/byStops/00.tar.gz';
  const response = await fetch(url)

  const decompressedData = ungzip(new Uint8Array(await response.arrayBuffer()));

  return decompressedData;
}

async function untar(tarBinary) {
  const CHUNK_SIZE = 512
  const files = []

  let position = 0

  while (position < tarBinary.length) {
    const headerChunk = tarBinary.slice(position, position + CHUNK_SIZE)
    const fileName = new TextDecoder().decode(headerChunk.slice(0, 100)).replace(/\0/g, '')

    if (fileName === '') {
      break
    }

    const fileSize = parseInt(new TextDecoder().decode(headerChunk.slice(124, 124 + 11)).replace(/\0/g, ''), 8)
    const dataStart = position + CHUNK_SIZE
    const dataEnd = dataStart + fileSize

    const fileData = tarBinary.slice(dataStart, dataEnd)

    files.push({ name: fileName, data: fileData })

    position = dataEnd + (CHUNK_SIZE - (fileSize % CHUNK_SIZE)) % CHUNK_SIZE
  }

  return files
}
