import glob
import os
import shutil
import zipfile


def move_single_subdir_contents_to_parent_dir(directory_path):
    # 指定したディレクトリに含まれるファイル/フォルダの一覧を取得
    contents = os.listdir(directory_path)
    
    # 指定したディレクトリに含まれるフォルダの一覧を取得
    subdirs = [content for content in contents if os.path.isdir(os.path.join(directory_path, content))]
    
    print(contents)

    # 指定したディレクトリに含まれるフォルダの数が1つである場合
    if len(subdirs) == 1:
        subdir_path = os.path.join(directory_path, subdirs[0])
        # フォルダ内の全てのファイル/フォルダを、親フォルダに移動
        for content in os.listdir(subdir_path):
            shutil.move(os.path.join(subdir_path, content), directory_path)
        # 空になったフォルダを削除
        os.rmdir(subdir_path)

files = glob.glob("./dir_out/*")
for file in files:
  if os.path.isdir(file):
    move_single_subdir_contents_to_parent_dir(file)
