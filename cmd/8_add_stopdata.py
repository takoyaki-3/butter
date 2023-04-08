import h3
import pandas as pd
import os

# ディレクトリのパスを指定する
directory = './dir_out'

# ディレクトリ内のディレクトリ一覧を取得する
subdirectories = [os.path.join(directory, d) for d in os.listdir(directory) if os.path.isdir(os.path.join(directory, d))]

# ディレクトリ一覧を出力する
print(subdirectories)

csv_files = []

for dir in subdirectories:
  dir = dir.replace('\\','/',-1)
  gtfsID = dir.split('/')[2][:-4]
  print(gtfsID)

  # GTFS stop_times.txtファイルを読み込む
  stop_times = pd.read_csv('./dir_out/'+gtfsID+'.zip/stops.txt')

  # H3レベル11のH3 Indexを生成して、各行に追加する
  stop_times['h3index_8'] = stop_times.apply(lambda row: h3.geo_to_h3(row['stop_lat'], row['stop_lon'], 8), axis=1)
  stop_times['gtfs_id'] = gtfsID

  # インデックスを含むstop_times.txtファイルを書き出す
  filename = 'stop_times_with_h3index_' + gtfsID + '.txt'
  stop_times.to_csv(filename, index=False)
  csv_files.append(filename)

print(csv_files)

# CSVファイルを読み込んでDataFrameに追加する
df_list = []
for file in csv_files:
  df = pd.read_csv(file)
  df_list.append(df)

# DataFrameを結合する
merged_df = pd.concat(df_list)

# 結合したDataFrameをCSVファイルに書き出す
merged_df.to_csv('merged_csv_file.csv', index=False)
