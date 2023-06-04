## BuTTER Library

BuTTER Library は、ストレージ上に細分化した状態で保存されているGTFSを基にした時刻表情報を集め、ブラウザ内で必要な情報に加工するライブラリです。DBを使わずにデータ処理をブラウザ内とする

## 関数と利用方法

1. `Butter.init()`
この関数は初期化に使用されます。例えば：
```javascript
import Butter from './dist.js';
Butter.init()
```

2. `Butter.getHostDataList()`
この関数はホストのデータリストを取得するために使用されます。例：
```javascript
const hostData = await Butter.getHostDataList()
console.log(hostData)
```

3. `Butter.getAgencyInfo(gtfs_id)`
特定のGTFS IDに関連する機関情報を取得します。例：
```javascript
const agencyInfo = await Butter.getAgencyInfo("your_gtfs_id")
console.log(agencyInfo)
```

4. `Butter.getBusStops(gtfs_id, version_id)`
特定のGTFS IDとバージョンIDに関連するバス停を取得します。例：
```javascript
const stops = await Butter.getBusStops("your_gtfs_id", "your_version_id")
console.log(stops)
```

5. `Butter.getTrips(gtfs_id, version_id)`
特定のGTFS IDとバージョンIDに関連するバスの旅行情報を取得します。例：
```javascript
const trips = await Butter.getTrips("your_gtfs_id", "your_version_id")
console.log(trips)
```

6. `Butter.getStopsBySubstring(substring)`
特定の文字列を含むバス停を取得します。例：
```javascript
const stops = await Butter.getStopsBySubstring("substring")
console.log(stops)
```

7. `Butter.getStopsWithinRadius(lat, lon, radius)`
特定の緯度、経度、半径の範囲内にあるバス停を取得します。例：
```javascript
const aroundStops = await Butter.getStopsWithinRadius(35.693906, 139.701504, 500)
console.log(aroundStops)
```

8. `Butter.getBusInfo(lat, lon)`
特定の緯度、経度に関連するバスの情報を取得します。例：
```javascript
const busInfo = await Butter.getBusInfo(35.693906, 139.701504)
console.log(busInfo)
```

9. `Butter.fetchTimeTableV1(gtfs_id, options)`
特定のGTFS IDとオプションに基づいて時刻表情報を取得します。例：
```javascript
let tt = await Butter.fetchTimeTableV1("your_gtfs_id", {
    date: "20230513",
    stop_ids: ["your_stop_id"]
})
console.log(tt)
```

10. `Butter.getComsumedOp()`
これまでに消費されたオペレーションの数を取得します。例：
```javascript
console.log("COMSUMED OPERATIONS ARE", Butter.getComsumedOp())
```
注意：上記の例では、`"your_gtfs_id"`, `"your_version_id"`, `"substring"`, `"your_stop_id"`などは実際の値に置き換える必要があります。

## webpackのbuild方法

### 依存モジュールのインストール

```sh
npm install
```

### build

```sh
npm run build
```

