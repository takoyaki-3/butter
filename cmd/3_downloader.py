import json
import urllib.error
import urllib.request
import time
import os

json_open = open('data.json', 'r', encoding='utf-8')
data = json.load(json_open)

for item in data:
    if 'gtfs_id' in item:
      print(item['gtfs_id'])
      gtfs_id = item['gtfs_id']
      url = item['GTFS_url']
      print(url)

      save_path = './gtfs/'+gtfs_id+'.zip'
      if not os.path.isdir('./gtfs'):
        os.makedirs('./gtfs')

      try:
        with urllib.request.urlopen(url) as download_file:
          data = download_file.read()
          with open(save_path, mode='wb') as save_file:
            save_file.write(data)
      except urllib.error.URLError as e:
        print(e)
      
      time.sleep(1)
