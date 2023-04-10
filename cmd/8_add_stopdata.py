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
  stop_times['gtfs_id'] = gtfsID

  # インデックスを含むstop_times.txtファイルを書き出す
  filename = 'stop_times_with_h3index_' + gtfsID + '.txt'
  stop_times.to_csv(filename, index=False)
  csv_files.append(filename)

# CSVファイルを読み込んでDataFrameに追加する
df_list = []
for file in csv_files:
  df = pd.read_csv(file)
  df_list.append(df)
  os.remove(file)

# DataFrameを結合する
merged_df = pd.concat(df_list)

# # 結合したDataFrameをCSVファイルに書き出す
# merged_df.to_csv('merged_csv_file.csv', index=False)

import pandas as pd
import h3

# H3 level to use for indexing
H3_LEVEL = 7

# Load stops.txt file into a pandas DataFrame
df_stops = merged_df

# Add H3 index column to DataFrame
df_stops["h3index"] = df_stops.apply(lambda row: h3.geo_to_h3(row["stop_lat"], row["stop_lon"], H3_LEVEL), axis=1)

# Get all unique H3 indexes in the DataFrame
unique_h3indexes = df_stops["h3index"].unique()

# Create a dictionary to store the stops for each H3 index
h3index_to_stops_dict = {h3index: [] for h3index in unique_h3indexes}

# Iterate through each stop and add it to the appropriate H3 index
for index, row in df_stops.iterrows():
    h3index = row["h3index"]
    h3indexes_to_add = h3.k_ring(h3index, 1) # Get all H3 indexes within 1 ring of the current H3 index
    for index_to_add in h3indexes_to_add:
        if index_to_add in h3index_to_stops_dict:
            h3index_to_stops_dict[index_to_add].append(row)

# Save each H3 index's stops to a separate file
os.mkdir('dist/byH3index')
for h3index in unique_h3indexes:
    df_h3index_stops = pd.DataFrame(h3index_to_stops_dict[h3index])
    filename = f"dist/byH3index/{h3index}_stops.csv"
    df_h3index_stops.to_csv(filename, index=False)

