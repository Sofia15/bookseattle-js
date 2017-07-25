var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var { API_URL } = require('./webpack.environment.config');
var webpack = require('webpack');
var environment = process.env.NODE_ENV === 'production' ?
    'production' :
    'development';

var webpackConfig = {
  entry: ['babel-polyfill', 'webcomponents.js/webcomponents-lite.js', 'whatwg-fetch', './index.js'],
  output: {
    path: path.resolve('./dist'),
    filename: 'index.[hash:16].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: "css-loader"
        })
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          plugins: [
            ['transform-react-jsx', {'pragma': 'html'}],
          ],
          presets: ['es2015'],
        }
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      favicon: 'logo.ico',
      template: 'index.html',
      hash: false
    }),
    new ExtractTextPlugin('index.[hash:16].css'),
    new webpack.DefinePlugin({
      API_URL: API_URL[environment]
    })
  ]
};

module.exports = webpackConfig;
