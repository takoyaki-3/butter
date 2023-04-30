# Cloudflare Worker Example with Webpack

このプロジェクトは、Webpack を使用して Cloudflare Workers のコードをビルドし、デプロイする方法を示すサンプルです。この Worker は、HTTPリクエストを受け取り、簡単なメッセージを返します。

## 前提条件

- [Node.js](https://nodejs.org/en) がインストールされていること
- [Cloudflare アカウント](https://dash.cloudflare.com/sign-up) が作成されていること
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) がインストールおよび設定されていること

## セットアップ
プロジェクトをクローンまたはダウンロードします。

```bash
git clone https://github.com/your_username/cloudflare-worker-example.git
cd cloudflare-worker-example
```

依存関係をインストールします。

```bash
npm install
```

## 開発
ローカルで開発を行い、変更をプレビューするには、以下のコマンドを使用します。

```bash
npm run preview
```

これにより、Cloudflare Workers のプレビューエンドポイントが開きます。

## ビルド
プロジェクトをビルドするには、以下のコマンドを実行します。

```bash
npm run build
```
これにより、dist ディレクトリに worker.js が生成されます。

## デプロイ
プロジェクトを Cloudflare Workers にデプロイするには、以下のコマンドを実行します。

```bash
npm run publish
```

これにより、指定したルート（この例では example.com/*）で動作するように Worker がデプロイされます。

## ライセンス
このプロジェクトは、MITライセンス の下でリリースされています。
