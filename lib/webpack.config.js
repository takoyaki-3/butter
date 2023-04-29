const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/fetch.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'fetch.js',
  }
};
