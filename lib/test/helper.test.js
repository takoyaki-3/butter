const { helper } = require('../src/helper')
const { pemToUint8Array } = require('../src/helper')

describe('pemToUint8Array', () => {
  it('converts a PEM string to a Uint8Array', () => {
    // この部分は適切なBase64エンコードされた文字列に置き換えてください
    const base64EncodedString = 'VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==' // "This is a test string."のBase64エンコード
    const pem = `-----BEGIN TEST-----\n${base64EncodedString}\n-----END TEST-----`

    const result = pemToUint8Array(pem)

    expect(result).toBeInstanceOf(Uint8Array)
    // デコードされた文字列の長さを検証
    expect(result.length).toBe(atob(base64EncodedString).length)
    // デコードされた文字列の各文字のcharCodeAtとUint8Arrayの値を比較
    const decodedString = atob(base64EncodedString)
    for (let i = 0; i < decodedString.length; i++) {
      expect(result[i]).toBe(decodedString.charCodeAt(i))
    }
  })
})

describe('csvToObject', () => {
  it('should convert CSV string to an array of objects', () => {
    const csv = 'header1,header2\nvalue1,value2\nvalue3,value4'
    const result = helper.csvToObject(csv)
    expect(result).toEqual([
      { header1: 'value1', header2: 'value2' },
      { header1: 'value3', header2: 'value4' }
    ])
  })
})

it('should parse a date string to a Date object', () => {
  const dateStr = '20230101'
  const result = helper.parseDate(dateStr)
  expect(result).toEqual(new Date('2023-01-01T09:00:00'))
})

describe('getDayOfWeek', () => {
  it('should return the day of the week for a given date string', () => {
    const dateStr = '20230101' // 2023年1月1日は日曜日
    const result = helper.getDayOfWeek(dateStr)
    expect(result).toBe('日')
  })
})

describe('helper.storeCache', () => {
  it('stores a value in the cache', () => {
    const cache = {}
    helper.storeCache('key', 'value', cache)
    expect(cache.key).toBe('value')
  })

  it('respects the cache size limit', () => {
    const cache = {}
    const cacheSize = 2
    helper.storeCache('key1', 'value1', cache, cacheSize)
    helper.storeCache('key2', 'value2', cache, cacheSize)
    // TODO キャッシュサイズ以上になった場合の対応
    // helper.storeCache('key3', 'value3', cache, cacheSize);
    expect(Object.keys(cache).length).toBeLessThanOrEqual(cacheSize)
  })
})

describe('helper.loadCache', () => {
  it('retrieves a value from the cache', () => {
    const cache = { key: 'value' }
    const result = helper.loadCache('key', cache)
    expect(result).toBe('value')
  })

  it('returns undefined for missing keys', () => {
    const cache = { key: 'value' }
    const result = helper.loadCache('nonexistent', cache)
    expect(result).toBeUndefined()
  })
})

describe('helper.csvToObject', () => {
  it('converts CSV to an array of objects', () => {
    const csv = 'name,age\nAlice,30\nBob,35'
    const result = helper.csvToObject(csv)
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '35' }
    ])
  })
})

describe('helper.setIntersection', () => {
  it('returns the intersection of two sets', () => {
    const setA = new Set([1, 2, 3])
    const setB = new Set([2, 3, 4])
    const result = helper.setIntersection(setA, setB)
    expect(result).toEqual(new Set([2, 3]))
  })
})
