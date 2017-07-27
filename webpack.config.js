var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var { API_URL, GOOGLE_MAPS_API_KEY } = require('./webpack.environment.config');
var webpack = require('webpack');
var S3Plugin = require('webpack-s3-plugin');
var deploy;
var environment = process.env.NODE_ENV === 'production' ?
    'production' :
    'development';

if (environment === "production") {
  deploy = new S3Plugin({
    s3Options: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'us-west-2'
    },
    s3UploadOptions: {
      Bucket: 'www.bookseattle.net'
    },
    cloudfrontInvalidateOptions: {
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      Items: ["/*"]
    }});
}

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
      favicon: 'favicon.ico',
      template: 'index.html',
      hash: false
    }),
    new ExtractTextPlugin('index.[hash:16].css'),
    new webpack.DefinePlugin({
      API_URL: API_URL[environment],
      GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY
    }),
    deploy
  ].filter(Boolean)
};

module.exports = webpackConfig;
