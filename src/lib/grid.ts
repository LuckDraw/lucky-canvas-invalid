import Lucky from './lucky'
import LuckyGridConfig, {
  PrizeFontType, PrizeImgType,
  ButtonFontType, ButtonImgType,
  CellFontType, CellImgType,
  RowsType, ColsType,
  BlockType,
  CellType,
  DefaultConfigType,
  DefaultStyleType,
  ActiveStyleType,
  StartCallbackType,
  EndCallbackType,
} from '../types/grid'
import { isExpectType, removeEnter, computePadding } from '../utils/index'
import { drawRoundRect, getLinearGradient, } from '../utils/math'
import { quad } from '../utils/tween'

export default class LuckyGrid extends Lucky {

  private rows: RowsType
  private cols: ColsType
  private blocks: Array<BlockType>
  private prizes: CellType<PrizeFontType, PrizeImgType>[]
  private button?: CellType<ButtonFontType, ButtonImgType>
  private defaultConfig: DefaultConfigType = {
    gutter: 5,
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500,
  }
  private defaultStyle: DefaultStyleType = {
    borderRadius: 20,
    fontColor: '#000',
    fontSize: '18px',
    fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
    fontWeight: '400',
    background: '#fff',
    shadow: '',
    wordWrap: true,
    lengthLimit: '90%',
  }
  private activeStyle: ActiveStyleType = {
    background: '#ffce98',
    shadow: '',
  }
  private startCallback?: StartCallbackType
  private endCallback?: EndCallbackType
  private readonly box: HTMLDivElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private boxWidth = 0                  // 九宫格宽度
  private boxHeight = 0                 // 九宫格高度
  private cellWidth = 0                 // 格子宽度
  private cellHeight = 0                // 格子高度
  private startTime = 0                 // 开始时间戳
  private endTime = 0                   // 结束时间戳
  private currIndex = 0                 // 当前index累加
  private stopIndex = 0                 // 刻舟求剑
  private endIndex = 0                  // 停止索引
  private demo = false                  // 是否自动游走
  private timer = null                  // 游走定时器
  private animationId = 0               // 帧动画id
  private FPS = 16.6                    // 屏幕刷新率
  private prizeFlag: number | undefined // 中奖索引
  // 所有格子
  private cells: CellType<CellFontType, CellImgType>[] = []
  // 图片缓存
  private cellImgs: Array<{ defaultImg: HTMLImageElement, activeImg?: HTMLImageElement }[]> = []
  // 奖品区域几何信息
  private prizeArea: { x: number, y: number, w: number, h: number } | undefined
  // 边框绘制信息
  private blockData: Array<[number, number, number, number, number, string]> = []

  /**
   * 九宫格构造器
   * @param el 元素标识
   * @param data 抽奖配置项
   */
  constructor (el: string, data: LuckyGridConfig = {}) {
    super()
    this.box = document.querySelector(el) as HTMLDivElement
    this.canvas = document.createElement('canvas')
    this.box.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    this.setData(data)
    // 收集首次渲染的图片
    let willUpdate: Array<CellImgType[] | undefined> = [[]]
    this.prizes && (willUpdate = this.prizes.map(prize => prize.imgs))
    this.button && (willUpdate[this.cols * this.rows - 1] = this.button.imgs)
    this.init(willUpdate)
  }

  /**
   * 初始化数据
   * @param data 
   */
  private setData (data: LuckyGridConfig): void {
    this.rows = Number(data.rows) || 3
    this.cols = Number(data.cols) || 3
    this.blocks = data.blocks || []
    this.prizes = data.prizes || []
    this.button = data.button
    this.startCallback = data.start
    this.endCallback = data.end
    const config = this.defaultConfig
    const style = this.defaultStyle
    const active = this.activeStyle
    for (let key in data.defaultConfig) {
      config[key] = data.defaultConfig[key]
    }
    config.gutter = this.getLength(config.gutter) * this.dpr
    config.speed /= 40
    for (let key in data.defaultStyle) {
      style[key] = data.defaultStyle[key]
    }
    style.borderRadius = this.getLength(style.borderRadius) * this.dpr
    for (let key in data.activeStyle) {
      active[key] = data.activeStyle[key]
    }
  }

  /**
   * 初始化 canvas 抽奖
   * @param willUpdateImgs 需要更新的图片
   */
  public init (willUpdateImgs: Array<CellImgType[] | undefined>): void {
    this.setDpr()
    this.setHTMLFontSize()
    const { box, canvas, dpr, defaultStyle, defaultConfig } = this
    if (!box) return
    this.boxWidth = canvas.width = box.offsetWidth * dpr
    this.boxHeight = canvas.height = box.offsetHeight * dpr
    this.optimizeClarity(canvas, this.boxWidth, this.boxHeight)
    // 合并奖品和按钮一起渲染
    this.cells = [...this.prizes]
    if (this.button) this.cells[this.cols * this.rows - 1] = { ...this.button }
    this.cells.forEach(cell => {
      cell.col = cell.col || 1
      cell.row = cell.row || 1
    })
    // 计算所有边框信息, 并获取奖品区域
    this.blockData = []
    this.prizeArea = this.blocks.reduce(({x, y, w, h}, block) => {
      const [paddingTop, paddingBottom, paddingLeft, paddingRight] = computePadding(block).map(n => n * dpr)
      this.blockData.push([x, y, w, h, block.borderRadius ? this.getLength(block.borderRadius) * dpr : 0, block.background])
      return {
        x: x + paddingLeft,
        y: y + paddingTop,
        w: w - paddingLeft - paddingRight,
        h: h - paddingTop - paddingBottom
      }
    }, { x: 0, y: 0, w: this.boxWidth, h: this.boxHeight })
    // 计算单一奖品格子的宽度和高度
    this.cellWidth = (this.prizeArea.w - defaultConfig.gutter * (this.cols - 1)) / this.cols
    this.cellHeight = (this.prizeArea.h - defaultConfig.gutter * (this.rows - 1)) / this.rows
    const endCallBack = (): void => {
      // 开始首次渲染
      this.draw()
      // 中奖标识开始游走
      this.demo && this.walk()
      // 点击按钮开始, 这里不能使用 addEventListener
      if (this.button) canvas.onclick = e => {
        const [x, y, width, height] = this.getGeometricProperty([
          this.button!.x,
          this.button!.y,
          this.button!.col || 1,
          this.button!.row || 1
        ])
        if (e.offsetX < x || e.offsetY < y || e.offsetX > x + width || e.offsetY > y + height) return false
        if (this.startTime) return
        this.startCallback?.(e)
      }
    }
    // 同步加载图片
    let num = 0, sum = 0
    if (isExpectType(willUpdateImgs, 'array')) {
      this.draw() // 先画一次防止闪烁, 因为加载图片是异步的
      willUpdateImgs.forEach((imgs, cellIndex) => {
        if (!imgs) return false
        imgs.forEach((imgInfo, imgIndex) => {
          sum++
          this.loadAndCacheImg(cellIndex, imgIndex, () => {
            num++
            if (sum === num) endCallBack.call(this)
          })
        })
      })
    }
    if (!sum) endCallBack.call(this)
  }

  /**
   * 单独加载某一张图片并计算其实际渲染宽高
   * @param { number } prizeIndex 奖品索引
   * @param { number } imgIndex 奖品图片索引
   * @param { Function } callBack 图片加载完毕回调
   */
  private loadAndCacheImg (
    prizeIndex: number,
    imgIndex: number,
    callBack: () => void
  ): void {
    const prize = this.cells[prizeIndex]
    if (!prize || !prize.imgs) return
    const imgInfo = prize.imgs[imgIndex]
    if (!this.cellImgs[prizeIndex]) this.cellImgs[prizeIndex] = []
    // 加载 defaultImg 默认图片
    let defaultImg = new Image()
    this.cellImgs[prizeIndex][imgIndex] = { defaultImg }
    defaultImg.src = imgInfo.src
    let num = 0, sum = 1
    defaultImg.onload = () => {
      num++
      num === sum && callBack.call(this)
    }
    // 如果有 activeImg 则多加载一张
    if (!imgInfo.hasOwnProperty('activeSrc')) return
    sum++
    let activeImg = new Image()
    this.cellImgs[prizeIndex][imgIndex].activeImg = activeImg
    activeImg.src = (imgInfo as PrizeImgType).activeSrc!
    activeImg.onload = () => {
      num++
      num === sum && callBack.call(this)
    }
  }

  /**
   * 计算图片的渲染宽高
   * @param imgObj 图片标签元素
   * @param imgInfo 图片信息
   * @param cell 格子信息
   * @return [渲染宽度, 渲染高度]
   */
  private computedWidthAndHeight (
    imgObj: HTMLImageElement,
    imgInfo: CellImgType,
    cell: CellType<CellFontType, CellImgType>
  ): [number, number] {
    // 根据配置的样式计算图片的真实宽高
    if (!imgInfo.width && !imgInfo.height) {
      // 如果没有配置宽高, 则使用图片本身的宽高
      return [imgObj.width, imgObj.height]
    } else if (imgInfo.width && !imgInfo.height) {
      // 如果只填写了宽度, 没填写高度
      let trueWidth = this.getWidth(imgInfo.width, cell.col)
      // 那高度就随着宽度进行等比缩放
      return [trueWidth, imgObj.height * (trueWidth / imgObj.width)]
    } else if (!imgInfo.width && imgInfo.height) {
      // 如果只填写了宽度, 没填写高度
      let trueHeight = this.getHeight(imgInfo.height, cell.row)
      // 那宽度就随着高度进行等比缩放
      return [imgObj.width * (trueHeight / imgObj.height), trueHeight]
    }
    // 如果宽度和高度都填写了, 就分别计算
    return [
      this.getWidth(imgInfo.width, cell.col),
      this.getHeight(imgInfo.height, cell.row)
    ]
  }

  /**
   * 绘制九宫格抽奖
   */
  private draw (): void {
    const { ctx, dpr, defaultStyle, activeStyle } = this
    // 清空画布
    ctx.clearRect(0, 0, this.boxWidth, this.boxWidth)
    // 绘制所有边框
    this.blockData.forEach(([x, y, w, h, r, background]) => {
      drawRoundRect(ctx, x, y, w, h, r, this.handleBackground(x, y, w, h, background))
    })
    // 绘制所有格子
    this.cells.forEach((prize, cellIndex) => {
      let [x, y, width, height] = this.getGeometricProperty([prize.x, prize.y, prize.col, prize.row])
      const isActive = cellIndex === this.currIndex % this.prizes.length >> 0
      // 处理阴影 (暂时先用any, 这里后续要优化)
      const shadow: any = (
        isActive ? activeStyle.shadow : (prize.shadow || defaultStyle.shadow)
      )
        .replace(/px/g, '') // 清空px字符串
        .split(',')[0].split(' ') // 防止有人声明多个阴影, 截取第一个阴影
        .map((n, i) => i < 3 ? Number(n) * dpr : n) // 把数组的前三个值*像素比
      // 绘制阴影
      if (shadow.length === 4) {
        ctx.shadowColor = shadow[3]
        ctx.shadowOffsetX = shadow[0]
        ctx.shadowOffsetY = shadow[1]
        ctx.shadowBlur = shadow[2]
        // 修正(格子+阴影)的位置, 这里使用逗号运算符
        shadow[0] > 0 ? (width -= shadow[0]) : (width += shadow[0], x -= shadow[0])
        shadow[1] > 0 ? (height -= shadow[1]) : (height += shadow[1], y -= shadow[1])
      }
      drawRoundRect(
        ctx, x, y, width, height,
        prize.borderRadius ? this.getLength(prize.borderRadius) * dpr : this.getLength(defaultStyle.borderRadius),
        this.handleBackground(x, y, width, height, prize.background, isActive)
      )
      // 清空阴影
      ctx.shadowColor = 'rgba(255, 255, 255, 0)'
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.shadowBlur = 0
      // 绘制图片
      prize.imgs && prize.imgs.forEach((imgInfo, imgIndex) => {
        if (!this.cellImgs[cellIndex]) return false
        const cellImg = this.cellImgs[cellIndex][imgIndex]
        if (!cellImg) return false
        const renderImg: HTMLImageElement = (isActive && cellImg.activeImg) || cellImg.defaultImg
        const [trueWidth, trueHeight] = this.computedWidthAndHeight(renderImg, imgInfo, prize)
        ctx.drawImage(
          renderImg,
          x + this.getOffsetX(trueWidth, prize.col),
          y + this.getHeight(imgInfo.top, prize.row),
          trueWidth,
          trueHeight
        )
      })
      // 绘制文字
      prize.fonts && prize.fonts.forEach(font => {
        // 字体样式
        let style = isActive && activeStyle.fontStyle
          ? activeStyle.fontStyle
          : (font.fontStyle || defaultStyle.fontStyle)
        // 字体加粗
        let fontWeight = isActive && activeStyle.fontWeight
          ? activeStyle.fontWeight
          : (font.fontWeight || defaultStyle.fontWeight)
        // 字体大小
        let size = isActive && activeStyle.fontSize
          ? this.getLength(activeStyle.fontSize)
          : this.getLength(font.fontSize || defaultStyle.fontSize)
        // 字体行高
        const lineHeight = isActive && activeStyle.lineHeight
          ? activeStyle.lineHeight
          : font.lineHeight || defaultStyle.lineHeight || font.fontSize || defaultStyle.fontSize
        ctx.font = `${fontWeight} ${size * dpr}px ${style}`
        ctx.fillStyle = (isActive && activeStyle.fontColor) ? activeStyle.fontColor : (font.fontColor || defaultStyle.fontColor!)
        let lines = [], text = String(font.text)
        // 计算文字换行
        if (font.hasOwnProperty('wordWrap') ? font.wordWrap : defaultStyle.wordWrap) {
          text = removeEnter(text)
          let str = ''
          for (let i = 0; i < text.length; i++) {
            str += text[i]
            let currWidth = ctx.measureText(str).width
            let maxWidth = this.getWidth(font.lengthLimit || defaultStyle.lengthLimit, prize.col)
            if (currWidth > maxWidth) {
              lines.push(str.slice(0, -1))
              str = text[i]
            }
          }
          if (str) lines.push(str)
          if (!lines.length) lines.push(text)
        } else {
          lines = text.split('\n')
        }
        lines.forEach((line, lineIndex) => {
          ctx.fillText(
            line,
            x + this.getOffsetX(ctx.measureText(line).width, prize.col),
            y + this.getHeight(font.top, prize.row) + (lineIndex + 1) * this.getLength(lineHeight) * dpr
          )
        })
      })
    })
  }

  /**
   * 处理背景色
   * @param x 
   * @param y 
   * @param width 
   * @param height 
   * @param background 
   * @param isActive 
   */
  private handleBackground (
    x: number,
    y: number,
    width: number,
    height: number,
    background: string,
    isActive = false
  ) {
    const { ctx, defaultStyle, activeStyle } = this
    background = isActive ? activeStyle.background : (background || defaultStyle.background)
    // 处理线性渐变
    if (background.includes('linear-gradient')) {
      background = getLinearGradient(ctx, x, y, width, height, background)
    }
    return background
  }

  /**
   * 对外暴露: 开始抽奖方法
   */
  public play (): void {
    if (this.startTime) return
    clearInterval(this.timer)
    cancelAnimationFrame(this.animationId)
    this.startTime = Date.now()
    this.prizeFlag = undefined
    this.run()
  }

  /**
   * 对外暴露: 缓慢停止方法
   * @param index 中奖索引
   */
  public stop (index: number): void {
    this.prizeFlag = index % this.prizes.length
  }

  /**
   * 实际开始执行方法
   * @param num 记录帧动画执行多少次
   */
  private run (num: number = 0): void {
    const { currIndex, prizes, prizeFlag, startTime, defaultConfig } = this
    let interval = Date.now() - startTime
    // 先完全旋转, 再停止
    if (interval >= defaultConfig.accelerationTime && prizeFlag !== undefined) {
      // 记录帧率
      this.FPS = interval / num
      // 记录开始停止的时间戳
      this.endTime = Date.now()
      // 记录开始停止的索引
      this.stopIndex = currIndex
      // 最终停止的索引
      this.endIndex = prizes.length * 5 + prizeFlag - (currIndex >> 0)
      cancelAnimationFrame(this.animationId)
      return this.slowDown()
    }
    this.currIndex = (currIndex + quad.easeIn(interval, 0.1, defaultConfig.speed, defaultConfig.accelerationTime)) % prizes.length
    this.draw()
    this.animationId = window.requestAnimationFrame(this.run.bind(this, num + 1))
  }

  /**
   * 缓慢停止的方法
   */
  private slowDown (): void {
    const { prizes, prizeFlag, stopIndex, endIndex, defaultConfig } = this
    let interval = Date.now() - this.endTime
    if (interval > defaultConfig.decelerationTime) {
      this.startTime = 0
      this.endCallback?.({...prizes.find((prize, index) => index === prizeFlag)})
      return cancelAnimationFrame(this.animationId)
    }
    this.currIndex = quad.easeOut(interval, stopIndex, endIndex, defaultConfig.decelerationTime) % prizes.length
    this.draw()
    this.animationId = window.requestAnimationFrame(this.slowDown.bind(this))
  }

  /**
   * 开启中奖标识自动游走
   */
  public walk (): void {
    clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.currIndex += 1
      this.draw()
    }, 1300)
  }

  /**
   * 计算奖品格子的几何属性
   * @param { array } [...矩阵坐标, col, row]
   * @return { array } [...真实坐标, width, height]
   */
  private getGeometricProperty ([x, y, col, row]: number[]) {
    const { defaultConfig, cellWidth, cellHeight } = this
    let res = [
      this.prizeArea!.x + (cellWidth + defaultConfig.gutter) * x,
      this.prizeArea!.y + (cellHeight + defaultConfig.gutter) * y
    ]
    col && row && res.push(
      cellWidth * col + defaultConfig.gutter * (col - 1),
      cellHeight * row + defaultConfig.gutter * (row - 1),
    )
    return res
  }

  /**
   * 获取长度
   * @param length 将要转换的长度
   * @return 返回长度
   */
  private getLength (length: string | number | undefined): number {
    if (isExpectType(length, 'number')) return length as number
    if (isExpectType(length, 'string')) return this.changeUnits(
      length as string,
      { clean: true }
    )
    return 0
  }

  /**
   * 转换并获取宽度
   * @param width 将要转换的宽度
   * @param col 横向合并的格子
   * @return 返回相对宽度
   */
  private getWidth (
    width: string | number | undefined,
    col: number = 1
  ) {
    if (isExpectType(width, 'number')) return (width as number) * this.dpr
    if (isExpectType(width, 'string')) return this.changeUnits(
      width as string,
      { denominator: this.cellWidth * col + this.defaultConfig.gutter * (col - 1) }
    )
    return 0
  }

  /**
   * 转换并获取高度
   * @param height 将要转换的高度
   * @param row 纵向合并的格子
   * @return 返回相对高度
   */
  private getHeight (
    height: string | number | undefined,
    row: number = 1
  ) {
    if (isExpectType(height, 'number')) return (height as number) * this.dpr
    if (isExpectType(height, 'string')) return this.changeUnits(
      height as string,
      { denominator: this.cellHeight * row + this.defaultConfig.gutter * (row - 1) }
    )
    return 0
  }

  /**
   * 获取相对(居中)X坐标
   * @param width 
   * @param col 
   */
  private getOffsetX (width: number, col = 1) {
    return (this.cellWidth * col + this.defaultConfig.gutter * (col - 1) - width) / 2
  }
}
