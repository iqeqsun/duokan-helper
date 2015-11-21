var webpack = require('webpack')

module.exports = {
  entry: './duokan-helper.es',
  output: {
    path: __dirname,
    filename: 'duokan-helper.js'
  },
  module: {
    loaders: [{
      test: /\.es$/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'react'],
        plugins: ['transform-do-expressions']
      }
    }]
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin()
  ]
}
