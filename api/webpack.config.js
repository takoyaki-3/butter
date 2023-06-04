const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'worker.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  target: 'webworker',
  optimization: {
    minimize: false, // Cloudflare Workersでは、minificationはサポートされていません。
  },
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify")
    }
  }
};
