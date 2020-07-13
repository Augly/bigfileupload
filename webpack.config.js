/*
 * @Descripttion : 
 * @version      : 
 * @Author       : zero
 * @Date         : 2020-07-11 13:14:22
 * @LastEditors  : zero
 * @LastEditTime : 2020-07-13 14:18:03
 */ 
 const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack')
module.exports = {
  //文件入口
  entry: {
    index: './lib/index.js'
  },
  mode: 'production',
  plugins: [new CleanWebpackPlugin()],
  output: {
    filename: '[name].js',
    //动态导入
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }],
  },
}