## BuTTER

<h1 align="center">
  BuTTER | <a href="https://butter.takoyaki3.com">Website</a> | <a href="https://tag-maker.butter.takoyaki3.com/">Tag Maker</a> | <a href="https://timetable.butter.takoyaki3.com">Timetable</a>
</h1>
<h3></h3>

<div style="text-align:center">
  <image src="https://raw.githubusercontent.com/takoyaki-3/butter/main/about/public/butter.png" style="width:200px">
</div>

## 概要

BuTTER（Bus Time-Table by Edge-Rumtime）は、数行のBuTTERタグをWebページに貼り付けることで、最新の時刻表をWebページに埋め込むことができるツールです。それに付随したライブラリ、データ変換ツール、WebAPIも提供しています。

## 特徴

- **簡単な実装**: BuTTERタグをWebページに貼り付けるだけで、時刻表を表示できます。
- **自動更新**: 時刻表は自動的に更新されるため、ダイヤ改正にも対応できます。
- **様々な機能**: バス停検索、周辺バス停表示、リアルタイム位置情報表示などの機能を提供します。
- **開発者向け**: 開発者はBuTTERライブラリを使用して、独自のアプリケーションに時刻表機能を統合できます。

## インストール

BuTTERは、以下の方法で利用できます。

- **BuTTERタグ**: [https://tag-maker.butter.takoyaki3.com/](https://tag-maker.butter.takoyaki3.com/) でタグを生成し、Webページに貼り付けます。
- **BuTTERライブラリ**: npmで公開されています。`npm install butter-lib` でインストールできます。
- **WebAPI**: [https://api.butter.takoyaki3.com/v1](https://api.butter.takoyaki3.com/v1) からアクセスできます。詳細なAPI仕様は、[https://butter.takoyaki3.com/api.html](https://butter.takoyaki3.com/api.html) を参照してください。

## 使い方

### BuTTERタグ

1. [https://tag-maker.butter.takoyaki3.com/](https://tag-maker.butter.takoyaki3.com/) にアクセスします。
2. 表示したい事業者とバス停を選択します。
3. 生成されたタグをコピーし、Webページに貼り付けます。

### BuTTERライブラリ

```javascript
import Butter from 'butter-lib';

// BuTTERの初期化
await Butter.init('https://butter.takoyaki3.com/v1.0.0/root.json');

// データリストの取得
const dataList = await Butter.getHostDataList();

// 特定の事業者の時刻表の取得
const timetable = await Butter.fetchTimeTableV1('ToeiBus', {
  date: '20240715',
  stop_ids: ['0605-07'],
});
```

### WebAPI

WebAPIのエンドポイントとパラメータについては、[https://butter.takoyaki3.com/api.html](https://butter.takoyaki3.com/api.html) を参照してください。

### 環境変数

BuTTERライブラリを使用する場合、以下の環境変数を設定できます。

- `BUTTER_ROOT`: BuTTERのルートURL。デフォルトは `https://butter.takoyaki3.com/v1.0.0/root.json` です。

### APIエンドポイント

BuTTERのWebAPIのエンドポイントは、 `https://api.butter.takoyaki3.com/v1` です。

### 設定ファイル

BuTTERは設定ファイルを使用しません。

### コマンド実行例

BuTTERのデータ変換ツールは、以下のコマンドで実行できます。

```bash
./cmd.sh
```

## プロジェクト構成

```
├── about
│   ├── public
│   │   └── v0.0.0
│   │       └── root.json
│   └── src
│       └── components
│           └── DemoSpace.vue
├── api
│   └── src
│       └── functionParams.js
├── cmd
│   └── helper
│       └── sign.go
├── lib
│   └── src
│       └── internal.js
├── storage
│   └── public_v1
│       └── v1.0.0
│           └── n-gram
│               └── テ.csv
├── tag-maker
│   └── src
│       └── components
│           └── TagInput.vue
└── timetable-app
    └── public
        └── v0.0.0
            └── root.json
```

### ディレクトリ

- `about`: BuTTERのプロジェクト概要とデモページのコードを含みます。
- `api`: BuTTERのWebAPIのコードを含みます。
- `cmd`: GTFSデータをBuTTER形式に変換するスクリプトを含みます。
- `lib`: BuTTERライブラリのコードを含みます。
- `storage`: BuTTERストレージサーバーのコードを含みます。
- `tag-maker`: BuTTERタグを生成するWebアプリケーションのコードを含みます。
- `timetable-app`: BuTTERを活用した時刻表アプリのコードを含みます。

### ファイル

- `root.json`: BuTTERのルート設定ファイル。
- `datalist.json`: データリスト。
- `info.json`: バージョン情報。
- `*.tar.gz`: 分割された時刻表データ。
- `*.csv`: GTFSデータ。

## ライセンス

MIT License

レポジトリをクローンして独自のサーバで運営しても構いません。万が一、このプロジェクトオーナーがサーバ運営をやめた場合でも独自ホストにより引き続き表示することができます。

## 貢献

バグレポートやフィーチャーリクエストは、GitHubのIssuesにて受け付けています。また、Pull Requestも歓迎します。