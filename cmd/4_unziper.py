import glob
import os
import shutil
import zipfile

files = glob.glob("./gtfs/*")
# os.mkdir("dir_out")
for file in files:
  print(file)
  # zipの検査
  with zipfile.ZipFile(file, 'r')as zf:
    t = zf.testzip()
    print(t) # data/sample1.txt
  err = shutil.unpack_archive(file, 'dir_out/'+os.path.basename(file))
  print(err)
