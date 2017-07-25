var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

var webpackConfig = {
  entry: ['babel-polyfill', './index.js'],
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
    new ExtractTextPlugin('index.[hash:16].css')
  ],
  // resolveLoader: {
  //   root: path.join(__dirname, 'node_modules'),
  // },
};

module.exports = webpackConfig;
