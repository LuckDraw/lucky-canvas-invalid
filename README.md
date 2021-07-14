# webpack4.x和5.x之间有哪些区别

### devServer热更新配置

webpack4.x 是设置`hot: true`

但是在 webpack5.x 里面改成了`liveReload: true`, 并且要禁用掉`hot`属性

webpack5.x 认为, 热更新只适用于web相关的项目, 所以想要实现热更新的效果, 还需要在devServer的外边加上`target: 'web'`

### devServer热更新启动

- webpack4.x 是通过`webpack-dev-server`来启动
- webpack5.x 是通过`webpack serve`来启动

### 命令设置环境变量

- webpack4.x `webpack --env.paramName`
- webpack5.x `webpack --env paramName`



# webpack

## es6+ 转 es5

```shell
npm i babel-loader @babel/core @babel/preset-env -D
```

配置loader

```js
{
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
        loader: 'babel-loader',
        options: {
            presets: [
                [
                    '@babel/prset-env',
                    {
                        useBuiltIns: 'usage', // 按需加载
                        corejs: 3, // corejs的版本
                        targets: 'defaults',
                        // targets: {
                        //     chrome: '58',
                        //     ie: '9',
                        //     firefox: '60',
                        //     safari: '10',
                        //     edge: '17'
                        // },
                    }
                ]
            ]
        }
    }
}
```

但是`preset-env`只能转换基本语法

`@babel/polyfill`可以转换所有js新语法

```shell
npm i @babel/polyfill -D
```

然后在入口文件里通过import来引入刚刚下载的polyfill(不推荐), 但是全部引入会导致打包文件非常大, 这时候就需要`core-js`来进行按需引入

```shell
npm i core-js -D
```

## 校验js代码格式

```shell
npm i eslint eslint-config-airbnb-base eslint-webpack-plugin eslint-plugin-import -D
```

- `eslint` 校验js代码的工具
- `eslint-config-airbnb-base` 最流行的js代码格式规范
- `eslint-webpack-plugin` webpack的eslint插件
- `eslint-plugin-import` 用于在package.json里面读取eslintConfig的配置项

```js
const ESLintPlugin = require('eslint-webpack-plugin')

{
    ...
    plugins: [
        new ESLintPlugin({
            fix: true
        })
    ]
    ...
}
```

eslintConfig

```json
...
    "eslintConfig": {
        "extends": "airbnb-base"
    }
...
```

## devServer

```shell
npm i webpack-dev-server -D
```

```js
target: 'web', // 告诉webpack是web相关的项目
devServer: {
    contentBase: './dist', // 静态资源目录
    compress: true, // 启用gzip压缩
    port: 1234, // 端口号
    liveReload: true, // 热更新
}
```


## 区分打包环境

### 通过环境变量区分

启动命令`webpack --env dev`

然后在 webpack.config.js 里面判断`env.dev`的值

```js
module.exports = (env, argv) => {
    const config = {
        mode: '',
        entry: '',
        output: {}
    }
    return config
}
```

### 通过配置文件区分

打包时可以通过传参指定打包文件

`webpack --config webpack.dev.config.js`

- 开发环境 webpack.dev.config.js

- 生产环境 webpack.prod.config.js

- 公共配置 webpack.base.config.js

这里就可以通过webpack-merge将多个配置合并在一起

```js
// webpack.xxx.config.js
const { merge }  = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.config.js')

const webpackConfig = merge(baseWebpackConfig, {
  // 这里写xxx环境的配置
})

module.exports = webpackConfig
```



## 注入全局常量

DefinePlugin是webpack的一个内置方法

```js
const { DefinePlugin } require('webpack')

module.exports = {
  ...
  plugins: [
    new DefinePlugin({
    	BASE_URL: JSON.stringify('127.0.0.1')
    })
  ]
}
```



## 自定义 plugin

> **官方描述**: webpack插件是一个具有apply方法的js对象, apply方法会被webpack的`compiler`方法调用, 并且在整个编译生命周期都可以访问`compiler`对象

> **原理**: 通过在`生命周期`的`钩子`中挂载函数, 来实现功能的扩展


|钩子|描述|类型|
| :-: | :-: | :-: |
|environment|环境准备好|SyncHook|
|compile|编译开始|SyncHook|
|compilation|编译结束|SyncHook|
|emit|打包前|AsyncSeriesHook|
|afterEmit|打包后|AsyncSeriesHook|
|Done|打包完成|SyncHook|

```js
// 自定义插件
class MyPlugin {
  // options 插件选项
	constructor (options) {}
  
  // 必须带有 apply 方法
  apply (compiler) {
    compiler.hooks.emit.tap('插件名称', (compilation) => {
      console.log('webpack构建过程开始', compilation)
    })
  }
}

module.exports = MyPlugin
```



https://blog.csdn.net/weixin_42502419/article/details/112284414