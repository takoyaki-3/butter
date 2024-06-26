import h3
import pandas as pd
import os

# ディレクトリのパスを指定する
directory = './feed_dir_out'

# ディレクトリ内のディレクトリ一覧を取得する
subdirectories = [os.path.join(directory, d) for d in os.listdir(directory) if os.path.isdir(os.path.join(directory, d))]

# ディレクトリ一覧を出力する
print(subdirectories)

csv_files = []

for dir in subdirectories:
  dir = dir.replace('\\','/',-1)
  feedID = dir.split('/')[2][:-4]
  gtfsID = feedID.split('_FEEDID_')[0]
  print(gtfsID, feedID)

  # GTFS stop_times.txtファイルを読み込む
  stop_times = pd.read_csv(directory+'/'+feedID+'.zip/stops.txt')
  stop_times['gtfs_id'] = gtfsID
  stop_times['feed_id'] = feedID

  # インデックスを含むstop_times.txtファイルを書き出す
  filename = 'stop_times_with_h3index_' + feedID + '.txt'
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
merged_df.to_csv('feed_merged_csv_file.csv', index=False)

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
if not os.path.isdir('v1.0.0/byH3index'):
    os.mkdir('v1.0.0/byH3index')

for h3index in unique_h3indexes:
    df_h3index_stops = pd.DataFrame(h3index_to_stops_dict[h3index])
    filename = f"v1.0.0/byH3index/{h3index}_stops.csv"
    df_h3index_stops.to_csv(filename, index=False)

# n-gram
import pandas as pd
from nltk.util import ngrams

# N-gram length
for N in range (1,2):

  # Load stops.txt file into a pandas DataFrame
  df_stops = pd.read_csv("feed_merged_csv_file.csv")

  # Create n-grams for each stop_name
  ngram_lists = df_stops["stop_name"].apply(lambda x: [''.join(ngram) for ngram in ngrams(x, N)])

  # Flatten n-gram lists
  ngrams_flat = [ngram for ngram_list in ngram_lists for ngram in ngram_list]

  # Get all unique n-grams
  unique_ngrams = list(set(ngrams_flat))

  # Create a dictionary to store the stops for each n-gram
  ngram_to_stops_dict = {}

  # Iterate through each stop and add it to the appropriate n-gram
  for index, row in df_stops.iterrows():
      stop_name = row["stop_name"]
      ngrams_to_add = list(ngrams(stop_name, N))
      for ngram_to_add in ngrams_to_add:
          ngram_str = ''.join(ngram_to_add)
          if ngram_str not in ngram_to_stops_dict:
              ngram_to_stops_dict[ngram_str] = []
          ngram_to_stops_dict[ngram_str].append(row)

  # Save each n-gram's stops to a separate file

  if not os.path.isdir('v1.0.0/n-gram'):
    os.mkdir('v1.0.0/n-gram')
  for ngram in unique_ngrams:
    df_ngram_stops = pd.DataFrame(ngram_to_stops_dict[ngram])
    filename = f"v1.0.0/n-gram/{ngram}.csv"
    df_ngram_stops.to_csv(filename, index=False)
