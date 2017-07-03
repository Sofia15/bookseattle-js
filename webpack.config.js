var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

var webpackConfig = {
  entry: 'index.js',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          plugins: [
            ['transform-react-jsx', {'pragma': 'html'}],
          ],
          presets: ['es2015'],
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'head',
      template: 'index.html',
    }),
  ],
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
};

module.exports = webpackConfig;
