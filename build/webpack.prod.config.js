// 开发环境
const { resolve } = require('path')
const { merge }  = require('webpack-merge')
const { name } = require('../package.json')
const webpackConfig = require('./webpack.config.js')

module.exports = merge(webpackConfig, {
  mode: 'development',
  entry: { // 入口
    umd: {
      // import: ['@babel/polyfill', './src/index.ts'],
      import: './src/index.ts',
      library: {
        name: 'LuckyCanvas',
        type: 'umd',
        umdNamedDefine: true,
      },
    },
    cjs: {
      // import: ['@babel/polyfill', './src/index.ts'],
      import: './src/index.ts',
      library: {
        name: 'LuckyCanvas',
        type: 'commonjs2',
      },
    },
  },
  output: { // 出口
    path: resolve(__dirname, '../dist'),
    filename: `${name}.[name].js`, // 导出文件名
    libraryTarget: 'umd', // 全局通用模块
    globalObject: 'self', // web使用self
  },
})
