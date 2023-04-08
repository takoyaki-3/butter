from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time

options = Options()
options.headless = True
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

driver.quit()
