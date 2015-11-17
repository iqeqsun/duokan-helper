module.exports = {
  entry: './duokan-helper.es',
  output: {
    path: __dirname,
    filename: 'duokan-helper.js'
  },
  module: {
    loaders: [{
      test: /\.es$/,
      loader: 'babel-loader?presets[]=es2015'
    }]
  }
}
