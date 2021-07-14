// 开发环境
const { resolve } = require('path')
const { container } = require('webpack')
const { ModuleFederationPlugin } = container
const { merge }  = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackConfig = require('./webpack.config.js')

module.exports = merge(webpackConfig, {
  mode: 'development',
  // entry: ['@babel/polyfill', './src/index.ts'],
  entry: './src/index.ts',
  output: { // 出口
    path: resolve(__dirname, '../dist'),
    filename: 'index.js', // 导出文件名
    library: 'LuckyCanvas', // 库的名称
    libraryTarget: 'umd', // 全局通用模块
    globalObject: 'self', // web使用self
  },
  devServer: {
    open: true,
    port: '9000',
    host: '127.0.0.1',
    liveReload: true, // 热更新
    contentBase: resolve(__dirname, '../dist'), // 静态资源指向路径
    compress: true, // 启用gzip压缩
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'head', // 插入到head标签中
      scriptLoading: 'blocking', // 不使用defer属性
    }),
    new ModuleFederationPlugin({ // 模块联邦
      name: 'App', // 应用名称
      // library: { type: 'var', name: 'App' },
      filename: 'lucky-canvas.js', // 打包后的文件名称
      exposes: { // 暴露模块 相当于export导出
        './LuckyCanvas': './src/index.ts' // 模块名称: 模块文件路径
      }
    })
  ]
})
