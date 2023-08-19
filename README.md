## BuTTER

BuTTER (Bus Time-Table by Edge-Rumtime) は、数行のBuTTER TagをWebページに貼り付けることで最新の時刻表をWebページに埋め込むことができるツールです。また、それに付随したライブラリ、データ変換ツール、WebAPIを提供しています。

各ディレクトリの役割は次の通りです。

|ディレクトリ|役割|
|---|---|
|api|時刻表情報をAPIとして提供するためのコード|
|cmd|GTFSを分割ファイル形式（butter形式）に変換するスクリプト|
|lib|分割ファイル形式（butter形式）をダウンロードして必要な情報に加工するライブラリ|
|webapp|タグを生成するためのWebアプリケーション|

## 関連URL
|項目|ドメイン|URL|
|---|---|---|
|プロジェクト概要|https://butter.takoyaki3.com|https://butter.takoyaki3.com|
|タグ作成|https://tag-maker.butter.takoyaki3.com|
|ライブラリ|https://www.npmjs.com/package/butter-lib|
|タグ|https://www.npmjs.com/package/butter-tag|https://butter.takoyaki3.com/tag-maker|
|時刻表サイト|https://timetable.butter.takoyaki3.com|https://butter.takoyaki3.com/timetable|

## サービスの場所


## 主な機能
#### getHostDataList()
ホストデータのリストを取得します。これは、利用可能な全てのGTFSデータソースのリストを取得するためのメソッドです。
#### getAgencyInfo(gtfs_id)
特定のGTFSデータソースから代理店情報を取得します。
#### getBusStops(gtfs_id, version_id)
特定のGTFSデータソースからバス停のリストを取得します。
#### getTrips(gtfs_id, version_id)
特定のGTFSデータソースからトリップのリストを取得します。
#### utils.getStopsBySubstring(substring)
バス停の名前から部分文字列による検索を行います。
#### utils.getStopsWithinRadius(lat, lon, radius)
指定した緯度、経度、半径（メートル単位）の範囲内のバス停を検索します。
#### utils.getBusInfo(lat,lon)
指定した緯度、経度からバスのリアルタイム情報を取得します。
#### utils.fetchTimeTableV1(gtfs_id, options)
特定のGTFSデータソースから時刻表を取得します。optionsオブジェクトは、取得したい日付と停留所IDまたはトリップIDを指定します。
#### getComsumedOp()
これまでに消費された操作数を取得します。

## ライセンス
MIT License

## 貢献
バグレポートやフィーチャーリクエストは、GitHubのIssuesにて受け付けています。また、Pull Requestも歓迎します。