const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    'duokan-helper': './src/duokan-helper.js'
  , 'background': './src/background.js'
  }
, output: {
    path: path.join(__dirname, 'build')
  , filename: '[name].js'
  }
, devtool: 'source-map'
, module: {
    loaders: [
      {
        test: /\.jsx?$/
      , exclude: /node_modules/
      , loader: 'babel'
      , query: {
          presets: ['latest', 'react']
        , plugins: [
            'syntax-do-expressions'
          , 'transform-do-expressions'
          , 'transform-react-jsx'
          , 'transform-runtime'
          ]
        }
      }
    , {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  }
, plugins: [
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  , new CopyWebpackPlugin([
      { from: './src/images', to: 'images' }
    , { from: './src/manifest.json' }
    ])
  ]
}
