const { exec } = require('child_process');
const fs = require('fs');

const dirs = ['./about', './timetable-app', './tag-maker']; // ビルドするディレクトリのリスト

dirs.forEach(dir => {
  // 依存パッケージのインストール
  exec('npm install', { cwd: dir }, (err, stdout, stderr) => {
    if (err) {
      console.error(`依存パッケージのインストールエラー: ${dir}`, err);
      return;
    }
    console.log(`依存パッケージのインストール成功: ${dir}`, stdout);

    // ビルドの実行
    exec('npm run build', { cwd: dir }, (err, stdout, stderr) => {
      if (err) {
        console.error(`ビルドエラー: ${dir}`, err);
        return;
      }
      console.log(`ビルド成功: ${dir}`, stdout);
    });
  });
});