// webpack.config.js

const path = require('path')
const webpack = require('webpack')

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
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  mode: 'production'
}
