<h1 align="center">
  BuTTER | <a href="https://butter.takoyaki3.com">Website</a> | <a href="https://tag-maker.butter.takoyaki3.com/">Tag Maker</a> | <a href="https://timetable.butter.takoyaki3.com">Timetable</a>
</h1>
<h3></h3>

<div style="text-align:center">
  <image src="https://raw.githubusercontent.com/takoyaki-3/butter/main/about/public/butter.png" style="width:200px">
</div>

BuTTER (Bus Time-Table by Edge-Rumtime) は、数行のBuTTER TagをWebページに貼り付けることで最新の時刻表をWebページに埋め込むことができるツールです。また、それに付随したライブラリ、データ変換ツール、WebAPIを提供しています。

|ディレクトリ|概要|URL|ホスト先|
|---|---|---|---|
|about|プロジェクト概要|https://butter.takoyaki3.com|Cloudflare Pages|
|tag-maker|タグを生成するためのWebアプリケーション|https://tag-maker.butter.takoyaki3.com|Cloudflare Pages|
|timetable-app|BuTTERを活用した時刻表アプリ|https://timetable.butter.takoyaki3.com|Cloudflare Pages|
|api|時刻表情報をAPIとして提供するためのコード||Cloudflare Worker|
|cmd|GTFSを分割ファイル形式（butter形式）に変換するスクリプト|||
|lib|分割ファイル形式（butter形式）をダウンロードして必要な情報に加工するライブラリ|https://www.npmjs.com/package/butter-lib|npm|
|tag|タグ|https://www.npmjs.com/package/butter-tag|npm|

## ツール目的

バスで地方の温泉に行くとき、レストランに行くとき、最寄りのバス停は記載があるものの、バスの時刻はバス会社へのPDFリンクのみであることが一般的です。
BuTTERを使うと、たった3行をWebページに貼り付けることで、ダイヤ改正を自動で反映したバスの時刻表をWebサイト上に載せることができます。

![](https://gyazo.com/4917b8468acca712bf82b3d45637f919.png)

## ライセンス
MIT License
レポジトリをクローンして独自のサーバで運営しても構いません。万が一、このプロジェクトオーナーがサーバ運営をやめた場合でも独自ホストにより引き続き表示することができます。

## 貢献
バグレポートやフィーチャーリクエストは、GitHubのIssuesにて受け付けています。また、Pull Requestも歓迎します。