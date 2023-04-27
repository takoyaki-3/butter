import { ungzip } from 'pako';

async function unTar(tarBinary) {
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

export async function getBinaryFromURL(url) {
  const response = await fetch(url)
  const buffer = (new Uint8Array(await response.arrayBuffer()))
  return buffer;
}

export async function getFilesFromTarGzURL(url) {
  const response = await fetch(url)
  const decompressedData = ungzip(new Uint8Array(await response.arrayBuffer()))
  return unTar(decompressedData)
}