## BuTTER

BuTTER (Bus Time-Table by Edge-Rumtime) は、数行のBuTTER TagをWebページに貼り付けることで最新の時刻表をWebページに埋め込むことができるツールです。

各ディレクトリの役割は次の通りです。

|ディレクトリ|役割|
|---|---|
|api|時刻表情報をAPIとして提供するためのコード|
|cmd|GTFSを分割ファイル形式（butter形式）に変換するスクリプト|
|lib|分割ファイル形式（butter形式）をダウンロードして必要な情報に加工するライブラリ|
|webapp|タグを生成するためのWebアプリケーション|
