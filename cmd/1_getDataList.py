import requests
import json
import os
from datetime import datetime

# JSONファイルのURL
files_url = 'https://api.gtfs-data.jp/v2/files'
feeds_url = 'https://api.gtfs-data.jp/v2/feeds'
odpt_url = 'https://members-portal.odpt.org/api/v1/resources'

# URLからJSONを取得する関数
def get_json_from_url(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# ファイルの読み込み
files_content = get_json_from_url(files_url)['body']
feeds_content = get_json_from_url(feeds_url)['body']
odpt_content = get_json_from_url(odpt_url)

# feeds_contentからorganization_idをキーとした辞書を作成
feeds_mapping = {feed['organization_id']: feed for feed in feeds_content}

# 出力テキストを作成する関数
def create_output_text_with_vehicle_position(files, feeds):
    output_text = "-------------\n"
    for file in files:
        organization_id = file['organization_id']
        feed = feeds.get(organization_id, {})
        vehicle_position_url = feed.get('real_time', {}).get('vehicle_position_url', '')
        output_text += f"事業者名:{file['organization_name']}\n"
        output_text += f"事業者名_url:{file['organization_web_url']}\n"
        output_text += f"都道府県:{file['feed_pref_id']}番\n"
        output_text += f"GTFSフィード名:{file['feed_name']}\n"
        output_text += f"ライセンス:{file['feed_license_id']}公開元: {file['organization_name']}\n"
        output_text += f"ライセンス_url:{file['feed_license_url']}\n"
        if vehicle_position_url: # VehiclePositionのURLが存在する場合のみ追加
            output_text += f"URLs:GTFS, VehiclePosition\n"
        else:
            output_text += f"URLs:GTFS\n"            
        output_text += f"GTFS_url:{file['file_url']}\n"
        if vehicle_position_url: # VehiclePositionのURLが存在する場合のみ追加
            output_text += f"VehiclePosition_url:{vehicle_position_url}\n"
        output_text += f"最新GTFS開始日:{file['file_from_date']}\n"
        output_text += f"最新GTFS終了日:{file['file_to_date']}\n"
        output_text += f"最終更新日:{feed['last_updated_at']}\n"
        output_text += f"詳細:詳細\n-------------\n"
    return output_text

def generate_odpt(entry):
    name_ja = entry['name_ja']
    url_ja = entry['url_ja']
    datasets = entry['datasets']
    output = ""

    # Read the JSON file
    conf = None
    if os.path.isfile('conf.json'):
        with open('conf.json', 'r', encoding='utf-8') as file:
            conf = json.load(file)
    
    for dataset in datasets:
        if dataset.get('vehicle_position'):
            gtfs_url = next((res['url'] for res in dataset.get('dataresource', []) if dataset.get('format_type') in ('GTFS', 'GTFS/GTFS-JP')), '')
            vehicle_position_url = dataset['vehicle_position']['url']
            license_type = dataset['license_type']
            license_url = "https://creativecommons.org/licenses/by/4.0/deed.ja" if "CC BY 4.0" in license_type else ""
            today_date = datetime.today().strftime('%Y-%m-%d')

            # API アクセスキーの置き換え
            if '[アクセストークン/YOUR_ACCESS_TOKEN]' in gtfs_url:
                if conf == None:
                    continue
                gtfs_url = gtfs_url.replace('[アクセストークン/YOUR_ACCESS_TOKEN]', conf['odptAPIKey'])
                vehicle_position_url = vehicle_position_url.replace('[アクセストークン/YOUR_ACCESS_TOKEN]', conf['odptAPIKey'])
            
            output += f"事業者名:{name_ja}\n"
            output += f"事業者名_url:{url_ja}\n"
            output += "都道府県:\n"
            output += f"GTFSフィード名:{name_ja}\n"
            output += f"ライセンス:{license_type}\n"
            output += f"ライセンス_url:{license_url}\n"
            output += "URLs:GTFS, VehiclePosition\n"
            output += f"GTFS_url:{gtfs_url}\n"
            output += f"VehiclePosition_url:{vehicle_position_url}\n"
            output += f"最新GTFS開始日:{today_date}\n"
            output += f"最新GTFS終了日:{today_date}\n"
            output += f"最終更新日:{today_date}\n"
            output += "詳細:詳細\n-------------\n"
    return output

# 出力テキストを作成
output_text = create_output_text_with_vehicle_position(files_content, feeds_mapping)
output_text += "".join([generate_odpt(entry) for entry in odpt_content])

now = datetime.now()
# 日付を指定された形式にフォーマット
dateStr = now.strftime("%Y-%m-%d")

# 東京都交通局を後から追加
output_text += '''事業者名:東京都交通局
事業者名_url:https://www.kotsu.metro.tokyo.jp
都道府県:東京都
GTFSフィード名:東京都交通局
ライセンス:CC BY 4.0公開元:東京都交通局・公共交通オープンデータ協議会
ライセンス_url:https://creativecommons.org/licenses/by/4.0/
URLs:GTFS, VehiclePosition
GTFS_url:https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip
VehiclePosition_url:https://api-public.odpt.org/api/v4/gtfs/realtime/ToeiBus
詳細:詳細
最新GTFS開始日:'''+dateStr+'''
最新GTFS終了日:'''+dateStr+'''
最終更新日:'''+dateStr+'''
-------------
'''
# 横浜市営バスを後から追加
output_text += '''事業者名:横浜市交通局
事業者名_url:https://www.city.yokohama.lg.jp/kotsu/bus
都道府県:神奈川県
GTFSフィード名:横浜市営バス
ライセンス:ODPT基本
ライセンス_url:https://developer.odpt.org/terms
URLs:GTFS, VehiclePosition
GTFS_url:https://api.odpt.org/api/v4/files/YokohamaMunicipal/data/YokohamaMunicipal-Bus-GTFS.zip?acl:consumerKey=[発行されたアクセストークン/YOUR_ACCESS_TOKEN]
VehiclePosition_url:https://api.odpt.org/api/v4/gtfs/realtime/YokohamaMunicipalBus_vehicle?acl:consumerKey=[発行されたアクセストークン/YOUR_ACCESS_TOKEN]
詳細:詳細
最新GTFS開始日:'''+dateStr+'''
最新GTFS終了日:'''+dateStr+'''
最終更新日:'''+dateStr+'''
-------------
'''
# 西武バスを後から追加
output_text += '''事業者名:西武バス
事業者名_url:https://www.seibubus.co.jp/sp
都道府県:東京都
GTFSフィード名:西武バス
ライセンス:ODPT基本
ライセンス_url:https://developer.odpt.org/terms
URLs:GTFS, VehiclePosition
GTFS_url:https://api.odpt.org/api/v4/files/SeibuBus/data/SeibuBus-GTFS.zip?acl:consumerKey=[発行されたアクセストークン/YOUR_ACCESS_TOKEN]
VehiclePosition_url:https://api.odpt.org/api/v4/gtfs/realtime/SeibuBus_vehicle?acl:consumerKey=[発行されたアクセストークン/YOUR_ACCESS_TOKEN]
詳細:詳細
最新GTFS開始日:'''+dateStr+'''
最新GTFS終了日:'''+dateStr+'''
最終更新日:'''+dateStr+'''
-------------
'''

# ファイルへ保存
output_file_path = './dataList.txt'
with open(output_file_path, 'w', encoding='utf-8') as file:
    file.write(output_text)
