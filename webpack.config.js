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
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'stage-0', 'react']
      }
    }]
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin()
  ]
}
