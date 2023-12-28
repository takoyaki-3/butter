// webpack.config.js

const path = require('path')

module.exports = {
  entry: './src/fetch.js',
  output: {
    filename: 'dist.js',
    path: path.resolve(__dirname),
    library: {
      // name: 'Butter',
      type: 'module'
    }
  },
  experiments: {
    outputModule: true
  },
  mode: 'production'
}
