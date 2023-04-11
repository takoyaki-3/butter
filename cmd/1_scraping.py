from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time

options = Options()
options.headless = True
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
driver = webdriver.Chrome(options=options)
driver.get("https://gtfs-data.jp/search")
time.sleep(5)  # JavaScriptが読み込まれるのを待つ

soup = BeautifulSoup(driver.page_source, "html.parser")
table = soup.find("table")  # <table>要素を取得する
rows = table.find_all("tr")  # <tr>要素をすべて取得する

cols = ['事業者名','都道府県','GTFSフィード名','ライセンス','URLs','最新GTFS開始日','最新GTFS終了日','最終更新日','詳細']

with open('output.txt', 'w',encoding='utf-8') as f:
    for row in rows:
        cells = row.find_all("td")  # <td>要素をすべて取得する
        f.write("-------------\n")
        for i in range (0,len(cells)):
            cell = cells[i]
            f.write(cols[i]+":"+cell.text+"\n")
            aa = cell.find_all("a")
            for a in aa:
                if a != None:
                    str = cols[i]
                    if cols[i] == 'URLs':
                        str = a.text
                    f.write(str+"_url"+":"+a.get('href')+"\n")  # <td>要素のテキストを表示する

    f.write("-------------")

    tobus = '''
事業者名:東京都交通局
事業者名_url:https://www.kotsu.metro.tokyo.jp
都道府県:東京都
GTFSフィード名:東京都交通局
ライセンス:CC BY 4.0公開元:東京都交通局・公共交通オープンデータ協議会
ライセンス_url:https://creativecommons.org/licenses/by/4.0/
URLs:GTFS, VehiclePosition
GTFS_url:https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip
VehiclePosition_url:https://api-public.odpt.org/api/v4/gtfs/realtime/ToeiBus
詳細:詳細
'''

    f.write(tobus)
    f.write("-------------\n")

driver.quit()
