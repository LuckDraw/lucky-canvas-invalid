
<div align="center">
  <img src="./web.svg" width="200" alt="logo" />
  <h1>lucky-canvas 抽奖插件</h1>
  <p>一个基于 JavaScript 的 ( 大转盘 / 九宫格 ) 抽奖插件</p>
  <p class="hidden">
    <a href="https://github.com/luckdraw/lucky-canvas#readme">简体中文</a>
    ·
    <a href="https://github.com/luckdraw/lucky-canvas/tree/master/en">English</a>
  </p>
  <p>
    <a href="https://github.com/LuckDraw/lucky-canvas/stargazers" target="_black">
      <img src="https://img.shields.io/github/stars/luckdraw/lucky-canvas?color=%23ffca28&logo=github&style=flat-square" alt="stars" />
    </a>
    <a href="https://github.com/luckdraw/lucky-canvas/network/members" target="_black">
      <img src="https://img.shields.io/github/forks/luckdraw/lucky-canvas?color=%23ffca28&logo=github&style=flat-square" alt="forks" />
    </a>
    <a href="https://www.npmjs.com/package/lucky-canvas" target="_black">
      <img src="https://img.shields.io/github/package-json/v/luckdraw/lucky-canvas?color=%23ffca28&logo=npm&style=flat-square" alt="version" />
    </a>
    <a href="https://www.npmjs.com/package/lucky-canvas" target="_black">
      <img src="https://img.shields.io/npm/dm/lucky-canvas?color=%23ffca28&logo=npm&style=flat-square" alt="downloads" />
    </a>
  </p>
  <p>
    <a href="https://github.com/buuing" target="_black">
      <img src="https://img.shields.io/badge/Author-%20buuing%20-7289da.svg?&logo=github&style=flat-square" alt="author" />
    </a>
    <a href="https://github.com/luckdraw/lucky-canvas/blob/master/LICENSE" target="_black">
      <img src="https://img.shields.io/github/license/luckdraw/lucky-canvas?color=%232dce89&logo=github&style=flat-square" alt="license" />
    </a>
  </p>
</div>

<br />

## 官方文档 & Demo演示

> **中文**：[https://100px.net/document/js.html](https://100px.net/document/js.html)  

> **English**：**If anyone can help translate the document, please contact me** `ldq404@qq.com`

<br />

## 在 Js / JQuery 中使用

### 方式 1：通过 script 标签引入

> 为了避免 CDN 链接出现异常或波动，我非常建议你**缓存到本地或服务器**

- **最新版本：** [https://cdn.jsdelivr.net/npm/lucky-canvas/umd.min.js](https://cdn.jsdelivr.net/npm/lucky-canvas/umd.min.js)
- **指定版本：** [https://cdn.jsdelivr.net/npm/lucky-canvas@1.0.7/umd.min.js](https://cdn.jsdelivr.net/npm/lucky-canvas@1.0.7/umd.min.js)


```html
<div id="my-lucky" style="width: 300px; height: 300px"></div>
<script src="https://cdn.jsdelivr.net/npm/lucky-canvas/umd.min.js"></script>
<script>

  // 大转盘抽奖
  let luckyWheel = new LuckyCanvas.LuckyWheel('#my-lucky', {
    // ...你的配置
  })
  
  // 九宫格抽奖
  let luckyGrid = new LuckyCanvas.LuckyGrid('#my-lucky', {
    // ...你的配置
  })

</script>
```

## 在 vue2.x / vue3.x 中使用

> [vue-luck-draw](https://github.com/luckdraw/vue-luck-draw#readme)
