import json
import urllib.error
import urllib.request
import time
import os

json_open = open('data_v1.json', 'r', encoding='utf-8')
datalist = json.load(json_open)

for item in datalist:
    if 'gtfs_id' in item:
      print(item['gtfs_id'])
      gtfs_id = item['gtfs_id']
      url = item['GTFS_url']
      print(url)

      save_path = './feed/'+gtfs_id+'.zip'
      if not os.path.isdir('./feed'):
        os.makedirs('./feed')

      try:
        with urllib.request.urlopen(url) as download_file:
          data = download_file.read()
          with open(save_path, mode='wb') as save_file:
            save_file.write(data)
      except urllib.error.URLError as e:
        print(e)
      
      time.sleep(1)

if not os.path.isdir('./gtfs'):
  os.makedirs('./gtfs')

for item in datalist:
    if 'gtfs_id' not in item:
      continue
    print(item)
    gtfs_id = item['gtfs_id']
    organization_id = item['organization_id']
    url = item['GTFS_url']

    origin_path = './feed/'+gtfs_id+'.zip'
    dest_path = './gtfs/'+organization_id+'.zip'

    # copy origin_path to dest_path
    with open(origin_path, 'rb') as origin_file:
      with open(dest_path, 'wb') as dest_file:
        dest_file.write(origin_file.read())
