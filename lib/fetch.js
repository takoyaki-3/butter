// butter-fetch v0.0.0
// Object Storageから情報を取得して適当な形に落とし込むためのライブラリ

// グローバル関数を汚さないためにIIFE形式で定義
// ES6のmoduleだと動かないブラウザが一応あるので，埋め込み用ライブラリであることを考えて普通の機能で実現する
(function () {
    let CONFIG = {
        debug: true,
        dependencies: [
            {
                src: "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js",
            }
        ]
    }
    let RUNTIME = {
        isReady: false,
        readyFlags: {
            dom: false,
            ca: false,
            deps: false,
        },
        loadedDeps: 0
    }

    // 名前から機能が推定できる注入可能なレベルに疎な関数をhelperとしてまとめる
    const helper = {
        async fetchJSON(url) {
            try {
                if (CONFIG.debug) {
                    console.log(url)
                }
                const resp = await fetch(url)
                if (!resp.ok) {
                    throw new Error("something wrong") // TODO
                }
                const data = await resp.json()
                return data
            } catch {
                throw new Error("something wrong") // TODO
            }
        },
        async fetchTarCSV(url) {

            // tarファイルを解凍する関数
            // 機能的には関数に独立させたいが，この関数の内部でしか使わないのでここでいいや
            const untar = (data) => {
                const files = []
                const headerSize = 512
                let offset = 0

                while (offset < data.length) {
                    const header = new Uint8Array(data.slice(offset, offset + headerSize))
                    const name = new TextDecoder().decode(header.subarray(0, 100)).replace(/\u0000/g, '').trim()
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

            await waitDepsReady()
            if (CONFIG.debug) {
                console.log(url)
            }
            try {
                const resp = await fetch(url)
                const gzipData = await resp.arrayBuffer()

                // gzip形式のデータを解凍する
                const rawBytes = pako.inflate(gzipData)

                // tarファイルを解凍する
                const files = untar(rawBytes)

                // ファイルの中身を操作する
                files.forEach((file) => {
                    const name = file.name
                    const content = new TextDecoder('utf-8').decode(file.buffer)
                    if (name.endsWith(".sig")) {
                        // TODO
                    } else {
                        const obj = csvToObject(content)
                        if (CONFIG.debug) {
                            console.log({
                                name, obj
                            })
                        }
                    }
                })
            } catch {
                throw new Error("something wrong") // TODO
            }
        },
        async fetchCSV(url) {
            try {
                if (CONFIG.debug) {
                    console.log(url)
                }
                const resp = await fetch(url)
                if (!resp.ok) {
                    throw new Error("something wrong") // TODO
                }
                const data = await resp.text()
                return helper.csvToObject(data)
            } catch {
                throw new Error("something wrong") // TODO
            }
        },
        csvToObject(csv) {
            const lines = csv.trim().split('\n') // 行に分割
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
        }
    }

    const internal = {
        async setCA(rootCA) {
            //末尾をスラッシュなしに統一する
            if (!rootCA.endsWith("root.json")) {
                return // TODO
            }
            CONFIG.rootCA = rootCA

            try {
                const req = await (await fetch(CONFIG.rootCA)).json()
                RUNTIME.CA = req

                RUNTIME.host = RUNTIME.CA.hosts[0] //TODO
                RUNTIME.readyFlags.ca = true
            } catch {
                throw new Error("something wrong") // TODO
            }
        },
        async waitReady() {
            while (!RUNTIME.isReady) {
                await helper.sleep(100)
                if (Object.values(RUNTIME.readyFlags).every(e => e)) {
                    RUNTIME.isReady = true
                }
            }
        },
        async waitDOMReady() {
            while (!RUNTIME.readyFlags.dom) {
                await helper.sleep(100)
            }
        },
        async waitCAReady() {
            while (!RUNTIME.readyFlags.ca) {
                await helper.sleep(100)
            }
        },
        async waitDepsReady() {
            while (!RUNTIME.readyFlags.deps) {
                await helper.sleep(100)
            }
        },
        loadDependencies(deps) {
            // webpackを使うほど仰々しくないので，独自に依存関係を解決する
            deps.forEach(e => {
                // DOM操作で依存関係の解決をする
                let script = document.createElement("script")
                script.src = e.src
                script.onload = () => {
                    RUNTIME.loadedDeps += 1
                    if (RUNTIME.loadedDeps == deps.length) {
                        RUNTIME.readyFlags.deps = true
                    }
                }
                window.document.body.appendChild(script)
            })
        }
    }

    window.Butter = {
        async getHostDataList() {
            await internal.waitCAReady()
            const data = await helper.fetchJSON(`${RUNTIME.host}/datalist.json`)
            return data.data_list
        },
        async getAgencyInfo(gtfsID) {
            await internal.waitCAReady()
            const data = await helper.fetchJSON(`${RUNTIME.host}/${gtfsID}/info.json`)
            return data
        },
        async getVersionInfo(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchJSON(`${RUNTIME.host}/${gtfsID}/${versionID}/info.json`)
            return data
        },
        async getBusStops(gtfsID, versionID) {
            await internal.waitCAReady()
            // どっちでも同じ?
            // const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/stops.txt`)
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/stops.txt`)
            return data
        },
        async getAgency(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/agency.txt`)
            return data
        },
        async getCalendar(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/calendar.txt`)
            return data
        },
        async getCalendarDates(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/calendar_dates.txt`)
            return data
        },
        async getFareAttributes(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/fare_attributes.txt`)
            return data
        },
        async getFareRules(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/fare_rules.txt`)
            return data
        },
        async getFeedInfo(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/feed_info.txt`)
            return data
        },
        // async getOfficeJp(gtfsID, versionID) {
        //     await internal.waitCAReady()
        //     const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/office_jp.txt`)
        //     return data
        // },
        async getRoutes(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/routes.txt`)
            return data
        },
        // async getShapes(gtfsID, versionID) {
        //     await internal.waitCAReady()
        //     const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/shapes.txt`)
        //     return data
        // },
        async getStopTimes(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/stop_times.txt`)
            return data
        },
        async getTransfers(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/transfers.txt`)
            return data
        },
        async getTranslations(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/translations.txt`)
            return data
        },
        async getTrips(gtfsID, versionID) {
            await internal.waitCAReady()
            const data = await helper.fetchCSV(`${RUNTIME.host}/${gtfsID}/${versionID}/GTFS/trips.txt`)
            return data
        },
    }

    const onLoad = async () => {
        document.addEventListener("DOMContentLoaded", function (event) {
            RUNTIME.readyFlags.dom = true
        })
        await internal.waitDOMReady()
        internal.setCA("https://butter.takoyaki3.com/v0.0.0/root.json")
        internal.loadDependencies(CONFIG.dependencies)
    }
    onLoad()
})()

