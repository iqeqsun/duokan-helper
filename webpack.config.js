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
        presets: ['react', 'es2015']
      }
    }]
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin()
  ]
}
