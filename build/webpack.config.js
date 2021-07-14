const { resolve } = require('path')

module.exports = {
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.ts|js$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    alias: { // 模块加载路径别名
      '@': resolve(__dirname, '../src')
    },
    extensions: ['.ts', '.js'], // 省略后缀
  },
  devtool: 'source-map',
}
