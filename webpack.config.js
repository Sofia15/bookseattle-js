var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

var webpackConfig = {
  entry: './index.js',
  output: {
    path: __dirname + 'dist',
    filename: 'bundle.js'
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
      inject: 'head',
      template: 'index.html',
      hash: true
    }),
    new ExtractTextPlugin('index.css')
  ],
  // resolveLoader: {
  //   root: path.join(__dirname, 'node_modules'),
  // },
};

module.exports = webpackConfig;
