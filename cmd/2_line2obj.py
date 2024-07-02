import json

data_v0 = []
data_v1 = []

with open('dataList.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()  # ファイルのすべての行を読み込む
    line_count = len(lines)
    i = 0
    while i < line_count:
        if lines[i].strip() == '-------------':  # 区切り線の場合
            d_v0 = {}  # 1つの事業者の情報を格納する辞書
            d_v1 = {}  # 1つの事業者の情報を格納する辞書
            i += 1
            while i < line_count and lines[i].strip() != '-------------':
                parts = lines[i].strip().split(':', 1)  # キーと値に分割する
                if len(parts) == 2:
                    d_v0[parts[0]] = parts[1]  # 辞書に追加する
                    d_v1[parts[0]] = parts[1]  # 辞書に追加する
                i += 1
            
            # IDの設定
            # 都営バス・GTFSデータレポジトリ・ODPT一般公開・ODPT限定公開ごとにURLからgtfs_idを生成する
            if 'GTFS_url' in d_v1:
                print(d_v1)
                # 都営バス
                if d_v1['GTFS_url'] == 'https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip':
                    d_v1['gtfs_id'] = d_v1['feed_id']
                    d_v1['feed_id'] = d_v1['feed_id'].split('_FEEDID_')[1]
                    d_v1['organization_id'] = d_v1['feed_id'].split('_FEEDID_')[0]
                    print('gtfs_id:',d_v1['gtfs_id'])
                    print('feed_id',d_v1['feed_id'])
                    d_v0['gtfs_id'] = d_v1['gtfs_id'].split('_FEEDID_')[0]
                    d_v0['feed_id'] = d_v1['feed_id']
                    d_v0['organization_id'] = d_v1['organization_id']
                # GTFSデータレポジトリ
                elif 'https://api.gtfs-data.jp/v2/organizations/' in d_v1['GTFS_url']:
                    d_v1['gtfs_id'] = d_v1['feed_id']
                    d_v1['feed_id'] = d_v1['feed_id'].split('_FEEDID_')[0]
                    d_v1['organization_id'] = d_v1['feed_id'].split('_FEEDID_')[0]
                    print('gtfs_id:',d_v1['gtfs_id'])
                    print('feed_id',d_v1['feed_id'])
                    d_v0['gtfs_id'] = d_v1['gtfs_id'].split('_FEEDID_')[0]
                    d_v0['feed_id'] = d_v1['feed_id']
                    d_v0['organization_id'] = d_v1['organization_id']
                # ODPT一般公開
                elif 'https://api-public.odpt.org/api/v4/files/odpt/' in d_v1['GTFS_url']:
                    gtfs_id = d_v1['GTFS_url'].split('https://api-public.odpt.org/api/v4/files/odpt/')[1]
                    feed_id = gtfs_id.split('/')[1].split('.zip')[0]
                    gtfs_id = gtfs_id.split('/')[0]
                    d_v1['feed_id'] = feed_id
                    d_v1['gtfs_id'] = gtfs_id + "_FEEDID_" + feed_id
                    d_v1['organization_id'] = d_v1['feed_id'].split('_FEEDID_')[0]
                    print('gtfs_id:',d_v1['gtfs_id'])
                    print('feed_id',d_v1['feed_id'])
                    d_v0['gtfs_id'] = d_v1['gtfs_id'].split('_FEEDID_')[0]
                    d_v0['feed_id'] = d_v1['feed_id']
                    d_v0['organization_id'] = d_v1['organization_id']
                # ODPT限定公開
                elif 'https://api.odpt.org/api/v4/files/odpt/' in d_v1['GTFS_url']:
                    gtfs_id = d_v1['GTFS_url'].split('https://api.odpt.org/api/v4/files/odpt/')[1]
                    feed_id = gtfs_id.split('/')[1].split('.zip')[0]
                    gtfs_id = gtfs_id.split('/')[0]
                    d_v1['gtfs_id'] = gtfs_id + "_FEEDID_" + feed_id
                    d_v1['feed_id'] = d_v1['gtfs_id'].split('_FEEDID_')[1]
                    d_v1['organization_id'] = d_v1['feed_id'].split('_FEEDID_')[0]
                    print('gtfs_id:',d_v1['gtfs_id'])
                    print('feed_id',d_v1['feed_id'])
                    d_v0['gtfs_id'] = d_v1['gtfs_id'].split('_FEEDID_')[0]
                    d_v0['feed_id'] = d_v1['feed_id']
                    d_v0['organization_id'] = d_v1['organization_id']
                elif 'https://api.odpt.org/api/v4/files/' in d_v1['GTFS_url']:
                    gtfs_id = d_v1['GTFS_url'].split('https://api.odpt.org/api/v4/files/')[1]
                    feed_id = gtfs_id.split('/')[1].split('.zip')[0]
                    gtfs_id = gtfs_id.split('/')[0]
                    d_v1['gtfs_id'] = gtfs_id + "_FEEDID_" + feed_id
                    d_v1['feed_id'] = d_v1['gtfs_id'].split('_FEEDID_')[1]
                    d_v1['organization_id'] = d_v1['feed_id'].split('_FEEDID_')[0]
                    print('gtfs_id:',d_v1['gtfs_id'])
                    print('feed_id',d_v1['feed_id'])
                    d_v0['gtfs_id'] = d_v1['gtfs_id'].split('_FEEDID_')[0]
                    d_v0['feed_id'] = d_v1['feed_id']
                    d_v0['organization_id'] = d_v1['organization_id']
            print('d:',d_v1)
            if 'gtfs_id' in d_v1:
                data_v1.append(d_v1)  # リストに追加する
            if 'gtfs_id' in d_v0:
                data_v0.append(d_v0)

# オブジェクトをJSON形式に変換してファイルに書き込む
with open('data_v1.json', 'w', encoding='utf-8') as f_v1:
    json.dump(data_v1, f_v1, ensure_ascii=False)

# オブジェクトをJSON形式に変換してファイルに書き込む
with open('data_v0.json', 'w', encoding='utf-8') as f_v0:
    json.dump(data_v0, f_v0, ensure_ascii=False)

