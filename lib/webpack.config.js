// webpack.config.js

const path = require('path');

module.exports = {
  entry: './src/fetch.js',
  output: {
    filename: 'fetch.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      // name: 'Butter',
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
  mode: 'production'
};
