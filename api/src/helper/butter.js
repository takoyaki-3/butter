// butter-fetch v0.0.0
// Object Storageから情報を取得して適当な形に落とし込むためのライブラリ

// グローバル関数を汚さないためにIIFE形式で定義
// ES6のmoduleだと動かないブラウザが一応あるので，埋め込み用ライブラリであることを考えて普通の機能で実現する
import { inflate } from 'pako';
import h3 from 'h3-js/legacy';
import haversine from 'haversine';

let CONFIG = {
    debug: true,
  //   dependencies: [
  //       {
  //           src: "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js",
  //       }
  //   ],
    cacheSize: 50
}
let RUNTIME = {
    isReady: false,
    readyFlags: {
        ca: false,
        deps: false,
    },
    loadedDeps: 0,
    cache: {},
    consumedOp: 0,
}

// 名前から機能が推定できる注入可能なレベルに疎な関数をhelperとしてまとめる
const helper = {
    storeCache(key, obj, kvStore = RUNTIME.cache, cacheMaxSize = CONFIG.cacheSize) {
        const len = Object.keys(kvStore).length
        if (len >= cacheMaxSize) {
            const rand = Math.floor(Math.random() * len)
            delete kvStore[Object.keys()[rand]]
        }
        kvStore[key] = obj
    },
    loadCache(key, kvStore = RUNTIME.cache) {
        if (kvStore[key]) {
            return kvStore[key]
        }
        let NULL
        return NULL
    },
    async fetchJSON(url) {
        const cache = helper.loadCache(url)
        if (cache) {
            return cache
        }
        try {
            if (CONFIG.debug) {
                console.log(url)
            }
            RUNTIME.consumedOp++
            const resp = await fetch(url)
            if (!resp.ok) {
                throw new Error("something wrong 1") // TODO
            }
            const data = await resp.json()
            helper.storeCache(url, data)
            return data
        } catch {
            throw new Error("something wrong 2"+url) // TODO
        }
    },
    async fetchTarCSV(url) {
        const cache = helper.loadCache(url)
        if (cache) {
            return cache
        }
        // tarファイルを解凍する関数
        // 機能的には関数に独立させたいが，この関数の内部でしか使わないのでここでいいや
        const untar = (data) => {
            const files = []
            const headerSize = 512
            let offset = 0

            while (offset < data.length) {
                const header = new Uint8Array(data.slice(offset, offset + headerSize))
                const nameEncoded = new TextDecoder().decode(header.subarray(0, 100)).replace(/\u0000/g, '').trim()
                const name = decodeURI(nameEncoded)
                const size = parseInt(new TextDecoder().decode(header.subarray(124, 136)).trim(), 8)
                offset += headerSize

                if (name) {
                    const buffer = data.slice(offset, offset + size)
                    files.push({ name, size, buffer })
                }

                offset += size
                if (size % 512 !== 0) {
                    offset += 512 - (size % 512)
                }
            }
            return files
        }

        await internal.waitDepsReady()
        if (CONFIG.debug) {
            console.log(url)
        }
        try {
            RUNTIME.consumedOp++
            const resp = await fetch(url)
            if (!resp.ok) {
                throw new Error("something wrong 3") // TODO
            }
            const gzipData = await resp.arrayBuffer()

            // gzip形式のデータを解凍する
            const rawBytes = inflate(gzipData)

            // tarファイルを解凍する
            const files = untar(rawBytes)

            let ret = {}

            // ファイルの中身を操作する
            files.forEach((file) => {
                const name = file.name
                const content = new TextDecoder('utf-8').decode(file.buffer)
                if (name.endsWith(".sig")) {
                    // TODO
                } else {
                    const obj = helper.csvToObject(content)
                    ret[name] = obj
                }
            })
            helper.storeCache(url, ret)
            return ret
        } catch {
            throw new Error("something wrong 4") // TODO
        }
    },
    async fetchCSV(url) {
        const cache = helper.loadCache(url)
        if (cache) {
            return cache
        }
        try {
            if (CONFIG.debug) {
                console.log(url)
            }
            RUNTIME.consumedOp++
            const resp = await fetch(url)
            if (!resp.ok) {
                throw new Error("something wrong 5") // TODO
            }
            const text = await resp.text()
            const data = helper.csvToObject(text)
            helper.storeCache(url, data)
            return data
        } catch {
            throw new Error("something wrong 6") // TODO
        }
    },
    csvToObject(csv) {
        const lines = csv.replace(/\r/g, "").trim().split('\n') // 行に分割
        const headers = lines.shift().split(',') // ヘッダーを取得
        return lines.map(line => {
            const values = line.split(',') // 値を取得
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] // ヘッダーと値を組み合わせてオブジェクトを生成
                return obj
            }, {})
        })
    },
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },
    parseDate(dateStr) {
        // YYYYMMDDの形式
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        return new Date(`${year}-${month}-${day}`);
    },
    getDayOfWeek(dateStr) {
        const date = helper.parseDate(dateStr)

        // 曜日を取得する
        const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
        return weekdays[date.getDay()];
    },
    isHoliday(dateStr) {
        const dayOfWeek = helper.getDayOfWeek(dateStr)
        flags = [
            ["土", "日"].includes(dayOfWeek)
        ]
        return flags.some(f => f)
    },
    setIntersection(setA, setB) {
        let ret = new Set()
        for (const e of setB) {
            if (setA.has(e)) {
                ret.add(e);
            }
        }
        return ret;
    },
    hash: {
        async SHA256(msg) {
            const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg))
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
        },
        async v1(str, mod) {
            const hash = helper.hash.SHA256(str)
            if (CONFIG.debug) {
                {
                    str, hash
                }
            }
            return (await hash).slice(0, mod)
        },
        async v2(str, mod) {
            const hash = helper.hash.SHA256(encodeURI(str))
            if (CONFIG.debug) {
                {
                    str, hash
                }
            }
            return (await hash).slice(0, mod)
        }
    },

}

const internal = {
    async setCA(rootCA) {
        //末尾をスラッシュなしに統一する
        if (!rootCA.endsWith("root.json")) {
            return // TODO
        }
        CONFIG.rootCA = rootCA

        let req;
        try {
            req = await (await fetch(CONFIG.rootCA)).json()
            RUNTIME.CA = req

            RUNTIME.host = RUNTIME.CA.hosts[0] //TODO
            RUNTIME.readyFlags.ca = true

            console.log("set CA",RUNTIME.host)
        } catch {
            throw new Error("something wrong 7"+CONFIG.rootCA+JSON.stringify(req)) // TODO
        }
    },
    async waitReady() {
        // while (!RUNTIME.isReady) {
        //     await helper.sleep(100)
        //     if (Object.values(RUNTIME.readyFlags).every(e => e)) {
        //         RUNTIME.isReady = true
        //     }
        // }
    },
    async waitCAReady() {
    },
    async waitDepsReady() {
        // while (!RUNTIME.readyFlags.deps) {
        //     await helper.sleep(100)
        // }
    }
}

export async function init(){
  await internal.setCA("https://butter.takoyaki3.com/v0.0.0/root.json")
}
export async function getHostDataList() {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${RUNTIME.host}/datalist.json`)
    return data.data_list
}
export async function getAgencyInfo(gtfsID) {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${RUNTIME.host}/${gtfsID}/info.json`)
    return data
}
export async function getVersionInfo(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchJSON(`${RUNTIME.host}/${gtfsID}/${versionID}/info.json`)
    return data
}
export async function getBusStops(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/stops.txt`)
    return data
}
export async function getAgency(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/agency.txt`)
    return data
}
export async function getCalendar(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/calendar.txt`)
    return data
}
export async function getCalendarDates(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/calendar_dates.txt`)
    return data
}
export async function getFareAttributes(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/fare_attributes.txt`)
    return data
}
export async function getFareRules(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/fare_rules.txt`)
    return data
}
export async function getFeedInfo(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/feed_info.txt`)
    return data
}
export async function getOfficeJp(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/office_jp.txt`)
    return data
}
export async function getRoutes(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/routes.txt`)
    return data
}
export async function getShapes(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/shapes.txt`)
    return data
}
export async function getStopTimes(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/stop_times.txt`)
    return data
}
export async function getTransfers(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/transfers.txt`)
    return data
}
export async function getTranslations(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/translations.txt`)
    return data
}
export async function getTrips(gtfsID, versionID) {
    await internal.waitCAReady()
    const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/trips.txt`)
    return data
}
export async function getTimeTableByStopHash(gtfsID, versionID, stopHash) {
    await internal.waitCAReady()
    const data = await helper.fetchTarCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/byStops/${stopHash}.tar.gz`)
    return data
}
export async function getTimeTableByTripHash(gtfsID, versionID, tripHash) {
    await internal.waitCAReady()
    const data = await helper.fetchTarCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/byTrips/${tripHash}.tar.gz`)
    return data
}

// ファイルをまたぐような複雑な処理はutilsにまとめている
export async function getTimeTableByStopID(gtfsID, versionID, stopID) {
    const versionInfo = await getVersionInfo(gtfsID, versionID)
    const stopHash = await helper.hash.v2(stopID, versionInfo.by_stop_hash_value_size)
    const timeTables = await getTimeTableByStopHash(gtfsID, versionID, stopHash)
    return timeTables[stopID]
}
export async function getTimeTableByTripID(gtfsID, versionID, tripID) {
      const versionInfo = await getVersionInfo(gtfsID, versionID)
      const tripHash = await helper.hash.v2(tripID, versionInfo.by_trip_hash_value_size)
      const timeTables = await getTimeTableByTripHash(gtfsID, versionID, tripHash)
      return timeTables[tripID]
  }
export async function getServiceIDs(gtfsID, versionID, dateStr) {
    const data = await Promise.all([
        getCalendar(gtfsID, versionID),
        getCalendarDates(gtfsID, versionID),
    ])
    const service = data[0]
    const calendar = data[1]

    const special = calendar.filter(e => {
        return e.date == dateStr
    })
    if (special.length > 0) {
        return special.map(e => e.service_id)
    }

    const date = helper.parseDate(dateStr)
    const weekOfDay = helper.getDayOfWeek(dateStr)

    const enabled = service.filter(e => {
        const endDate = helper.parseDate(e.end_date)
        return date.getTime() <= endDate.getTime()
    })

    return enabled.filter(e => {
        const flags = [
            e.monday == "1" && weekOfDay === "月",
            e.tuesday == "1" && weekOfDay === "火",
            e.wednesday == "1" && weekOfDay === "水",
            e.thursday == "1" && weekOfDay === "木",
            e.friday == "1" && weekOfDay === "金",
            e.saturday == "1" && weekOfDay === "土",
            e.sunday == "1" && weekOfDay === "日",
        ]
        return flags.some(f => f)
    }).map(e => e.service_id)
}
export async function findTrips(gtfsID, versionID, stopIDs) {
    const data = await Promise.all(stopIDs.map(e => getTimeTableByStopID(gtfsID, versionID, e)))
    const trips = data.map(x => new Set(x.map(y => y.trip_id)))
    const interSection = trips.reduce((prev, cur) => helper.setIntersection(prev, cur), trips.length > 0 ? trips[0] : new Set()) //TODO
    return [...interSection]
}
export async function findTimeTableByStopID(gtfsID, versionID, stopID, date) {
    const data = await Promise.all([
        getTimeTableByStopID(gtfsID, versionID, stopID),
        getServiceIDs(gtfsID, versionID, date)
    ])
    const timetable = data[0]
    const services = data[1]
    let ret = [];
    for (const serviceID of services) {
        ret = ret.concat(
            timetable.filter(e => e.service_id == serviceID)
        )
    }
    return ret
}
export async function findTimeTableByTripIDs(gtfsID, versionID, TripIDs) {
    const data = await Promise.all(TripIDs.map(e => getTimeTableByTripID(gtfsID, versionID, e)))
    let ret = []
    for (const e of data) {
        ret = ret.concat(e)
    }
    return ret
}
export async function fetchTimeTableV1(gtfsID, options, version = "optional") {
    const optionSample = {
        // INDEX1
        "stop_ids": ["出発するバス停のID", "目的地のバス停ID", "経由地のバス停ID"],
        // INDEX1-REQUIRED OPTION
        "date": "20230101",
        // INDEX2
        "trip_ids": [
            "取得したいバスのID"
        ],
        // FILTER1
        "start_time": "いつのバスからリストアップするか",
        // FILTER2
        "end_time": "いつまでのバスをリストアップするか",
        // TODO
        "positions": [
            { "lat": "", "lon": "", "r": "半径" }
        ],//優先度低い
    }
    if (version == "optional") {
        const versionInfo = await getAgencyInfo(gtfsID)
        version = versionInfo.slice(-1)[0].version_id
    }
    let stop_times = []
    if (options.stop_ids) {
        if (!options.date) {
            throw new Error("date is required when stop_ids are selected")
        }
        const stopID = options.stop_ids[0]
        const constraints = options.stop_ids
        const data = await Promise.all([
            findTimeTableByStopID(gtfsID, version, stopID, options.date),
            findTrips(gtfsID, version, constraints)
        ])
        const tripSet = new Set(data[1].concat(options.trip_ids || []))
        const filtered = data[0].filter(e => tripSet.has(e.trip_id))
        for (const e of filtered) {
            stop_times.push({
                trip_id: e.trip_id,
                stop_id: e.stop_id,
                arrival_time: e.arrival_time,
                departure_time: e.departure_time,
                predict_time: "NOT IMPLEMENTED"
            })
        }
    } else if (options.trip_ids) {
        const data = await findTimeTableByTripIDs(gtfsID, version, options.trip_ids)
        for (const e of data) {
            stop_times.push({
                trip_id: e.trip_id,
                stop_id: e.stop_id,
                arrival_time: e.arrival_time,
                departure_time: e.departure_time,
                predict_time: "NOT IMPLEMENTED"
            })
        }
    } else {
        throw new Error("stop_ids or trip_ids are required")
    }
    if (options.start_time) {
        stop_times = stop_times.filter(e => e.date >= options.start_time)
    }
    if (options.end_time) {
        stop_times = stop_times.filter(e => e.date <= options.end_time)
    }
    stop_times = stop_times.sort((a, b) => (a.date < b.date) ? -1 : 1)
        .sort((a, b) => (a.trip_id < b.trip_id) ? -1 : 1)
    return {
        stop_times: Object.values(stop_times),
        properties: "NOT IMPLEMENTED"
    }
  }

export async function getStopsWithinRadius(lat, lon, radius) {
    const h3Index = h3.geoToH3(lat, lon, 7);
    // const neighboringH3Indexes = h3.kRing(h3Index, 1);
  
    const url = `${RUNTIME.host}/byH3index/${h3Index}_stops.csv`;
    console.log(url)
    const response = await fetch(url)
    if (response.status !== 200) {
        throw new Error("Failed to fetch data from URL.");
      }
  
    const stopData = new TextDecoder('utf-8').decode(await response.arrayBuffer());
  
    const stops = stopData.split('\n')
      .slice(1)
      .map(line => {
        const [
          stop_id,
          stop_name,
          platform_code,
          stop_lat,
          stop_lon,
          zone_id,
          location_type,
          gtfs_id,
          stop_code,
          stop_desc,
          stop_url,
          parent_station,
          stop_timezone,
          wheelchair_boarding,
          level_id,
          h3index
        ] = line.split(',');
  
        return {
          stop_id,
          stop_name,
          platform_code,
          stop_lat: parseFloat(stop_lat),
          stop_lon: parseFloat(stop_lon),
          zone_id,
          location_type,
          gtfs_id,
          stop_code,
          stop_desc,
          stop_url,
          parent_station,
          stop_timezone,
          wheelchair_boarding,
          level_id,
          h3index
        };
      });
  
      const stopsWithinRadius = stops.filter(stop => {
        const start = { latitude: lat, longitude: lon };
        const end = { latitude: stop.stop_lat, longitude: stop.stop_lon };
        const distance = haversine(start, end, { unit: 'meter' });
        return distance <= radius;
      });
    
      return stopsWithinRadius;
  }
export async function getStopsBySubstring(substring) {
    try {
      const url = `${RUNTIME.host}/n-gram/${encodeURIComponent(substring[0])}.csv`;
      const response = await fetch(url);
  
      if (response.status !== 200) {
        throw new Error("Failed to fetch data from URL.");
      }
  
      const data = new TextDecoder('utf-8').decode(await response.arrayBuffer());
      const lines = data.split("\n");
      const headers = lines[0].split(",");
  
      const stops = [];
  
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue;
  
        const values = lines[i].split(",");
        const stop = {};
  
        for (let j = 0; j < headers.length; j++) {
          stop[headers[j]] = values[j];
        }
  
        // stop_name に substring が含まれる場合のみ、結果に追加
        if (stop.stop_name.includes(substring)) {
          stops.push(stop);
        }
      }
  
      return stops;
    } catch (error) {
      console.error(`Error fetching stops data: ${error.message}`);
      return [];
    }
  }           
