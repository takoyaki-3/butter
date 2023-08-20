const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const dirs = ['./about', './timetable-app', './tag-maker']; // ビルドするディレクトリのリスト

const buildDir = async (dir) => {
  try {
    console.log(`依存パッケージのインストール開始: ${dir}`);
    await execAsync('npm install', { cwd: dir });
    console.log(`依存パッケージのインストール成功: ${dir}`);
    
    console.log(`ビルド開始: ${dir}`);
    await execAsync('npm run build', { cwd: dir });
    console.log(`ビルド成功: ${dir}`);
  } catch (err) {
    console.error(`エラー: ${dir}`, err);
  }
};

Promise.all(dirs.map(dir => buildDir(dir)))
  .then(() => console.log('全てのビルドが完了しました'))
  .catch(err => console.error('ビルド中にエラーが発生しました', err));
