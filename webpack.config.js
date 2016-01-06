var webpack = require('webpack')

module.exports = {
  entry: {
    'duokan-helper': './duokan-helper.es'
  , 'background': './background.es'
  }
, output: {
    path: __dirname
  , filename: '[name].js'
  }
, module: {
    loaders: [{
      test: /\.es$/
    , exclude: /node_modules/
    , loader: 'babel'
    , query: {
        presets: ['es2015', 'stage-0', 'stage-1', 'stage-2', 'stage-3', 'react']
      , plugins: ['transform-runtime', 'syntax-do-expressions', 'syntax-async-functions', 'syntax-async-generators', 'transform-async-to-generator']
      }
    }]
  }
, plugins: [
    //new webpack.optimize.UglifyJsPlugin(),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ]
}
