import json

data = []  # 各事業者の情報を格納するリスト

with open('dataList.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()  # ファイルのすべての行を読み込む
    line_count = len(lines)
    i = 0
    while i < line_count:
        if lines[i].strip() == '-------------':  # 区切り線の場合
            d = {}  # 1つの事業者の情報を格納する辞書
            i += 1
            while i < line_count and lines[i].strip() != '-------------':
                parts = lines[i].strip().split(':', 1)  # キーと値に分割する
                if len(parts) == 2:
                    d[parts[0]] = parts[1]  # 辞書に追加する
                i += 1
            
            # IDの設定
            # 都営バス・GTFSデータレポジトリ・ODPT一般公開・ODPT限定公開ごとにURLからgtfs_idを生成する
            if 'GTFS_url' in d:
                # 都営バス
                if d['GTFS_url'] == 'https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip':
                    d['gtfs_id'] = 'ToeiBus'
                # GTFSデータレポジトリ
                elif 'https://api.gtfs-data.jp/v2/organizations/' in d['GTFS_url']:
                    gtfs_id = d['GTFS_url'].split('https://api.gtfs-data.jp/v2/organizations/')[1]
                    gtfs_id = gtfs_id.split('/')[0]
                    d['gtfs_id'] = gtfs_id
                # ODPT一般公開
                elif 'https://api-public.odpt.org/api/v4/files/odpt/' in d['GTFS_url']:
                    gtfs_id = d['GTFS_url'].split('https://api-public.odpt.org/api/v4/files/odpt/')[1]
                    gtfs_id = gtfs_id.split('/')[0]
                    d['gtfs_id'] = gtfs_id
                # ODPT限定公開
                elif 'https://api.odpt.org/api/v4/files/odpt/' in d['GTFS_url']:
                    gtfs_id = d['GTFS_url'].split('https://api.odpt.org/api/v4/files/odpt/')[1]
                    gtfs_id = gtfs_id.split('/')[0]
                    d['gtfs_id'] = gtfs_id
                elif 'https://api.odpt.org/api/v4/files/' in d['GTFS_url']:
                    gtfs_id = d['GTFS_url'].split('https://api.odpt.org/api/v4/files/')[1]
                    gtfs_id = gtfs_id.split('/')[0]
                    d['gtfs_id'] = gtfs_id
            data.append(d)  # リストに追加する

# オブジェクトをJSON形式に変換してファイルに書き込む
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
