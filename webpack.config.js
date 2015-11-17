module.exports = {
  entry: './duokan-helper.es',
  output: {
    path: __dirname,
    filename: 'duokan-helper.js'
  },
  modules: {
    loaders: [{
      test: /\.es$/,
      loader: 'babel-loader'
    }]
  }
}
