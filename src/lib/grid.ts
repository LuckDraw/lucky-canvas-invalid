import Lucky from './lucky'
import { ConfigType, UniImageType } from '../types/index'
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

type PrizesType = CellType<PrizeFontType, PrizeImgType>[]
type ButtonType = CellType<ButtonFontType, ButtonImgType>

export default class LuckyGrid extends Lucky {
  /**
   * 九宫格构造器
   * @param config 元素标识
   * @param data 抽奖配置项
   */
  constructor (config: string | HTMLDivElement | ConfigType, data: LuckyGridConfig = {}) {
    super(config)
    this.initData(data)
    this.initComputed()
    this.initWatch()
    // 收集首次渲染的图片
    let willUpdate: Array<CellImgType[] | undefined> = [[]]
    this.prizes && (willUpdate = this.prizes.map(prize => prize.imgs))
    this.button && (willUpdate[this.cols * this.rows - 1] = this.button.imgs)
    this.init(willUpdate)
  }

  private rows: RowsType = 3
  private cols: ColsType = 3
  private blocks: Array<BlockType> = []
  private prizes: PrizesType = []
  private button?: ButtonType
  private defaultConfig: DefaultConfigType = {}
  private _defaultConfig = { // 此处初始化无用, 是为了方便类型推导才加的
    gutter: 5,
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500,
  }
  private defaultStyle: DefaultStyleType = {}
  private _defaultStyle = { // 此处初始化无用, 是为了方便类型推导才加的
    borderRadius: 20,
    fontColor: '#000',
    fontSize: '18px',
    fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
    fontWeight: '400',
    lineHeight: '',
    background: '#fff',
    shadow: '',
    wordWrap: true,
    lengthLimit: '90%',
  }
  private activeStyle: ActiveStyleType = {}
  private _activeStyle = { // 此处初始化无用, 是为了方便类型推导才加的
    background: '#ffce98',
    shadow: '',
    fontStyle: '',
    fontWeight: '',
    fontSize: '',
    lineHeight: '',
    fontColor: '',
  }
  private startCallback?: StartCallbackType
  private endCallback?: EndCallbackType
  private cellWidth = 0                 // 格子宽度
  private cellHeight = 0                // 格子高度
  private startTime = 0                 // 开始时间戳
  private endTime = 0                   // 结束时间戳
  private currIndex = 0                 // 当前index累加
  private stopIndex = 0                 // 刻舟求剑
  private endIndex = 0                  // 停止索引
  private demo = false                  // 是否自动游走
  private timer = 0                     // 游走定时器
  private animationId = 0               // 帧动画id
  private FPS = 16.6                    // 屏幕刷新率
  private prizeFlag: number | undefined // 中奖索引
  // 所有格子
  private cells: CellType<CellFontType, CellImgType>[] = []
  // 奖品区域几何信息
  private prizeArea: { x: number, y: number, w: number, h: number } | undefined
  // 图片缓存
  private cellImgs: Array<{
    defaultImg: HTMLImageElement | UniImageType,
    activeImg?: HTMLImageElement | UniImageType
  }[]> = []

  /**
   * 初始化数据
   * @param data
   */
  private initData (data: LuckyGridConfig): void {
    this.$set(this, 'rows', Number(data.rows) || 3)
    this.$set(this, 'cols', Number(data.cols) || 3)
    this.$set(this, 'blocks', data.blocks || [])
    this.$set(this, 'prizes', data.prizes || [])
    this.$set(this, 'button', data.button)
    this.$set(this, 'defaultConfig', data.defaultConfig || {})
    this.$set(this, 'defaultStyle', data.defaultStyle || {})
    this.$set(this, 'activeStyle', data.activeStyle || {})
    this.$set(this, 'startCallback', data.start)
    this.$set(this, 'endCallback', data.end)
  }

  /**
   * 初始化属性计算
   */
  private initComputed (): void {
    // 默认配置
    this.$computed(this, '_defaultConfig', () => {
      const config = {
        gutter: 5,
        speed: 20,
        accelerationTime: 2500,
        decelerationTime: 2500,
        ...this.defaultConfig
      }
      config.gutter = this.getLength(config.gutter)
      config.speed = config.speed / 40
      return config
    })
    // 默认样式
    this.$computed(this, '_defaultStyle', () => {
      return {
        borderRadius: 20,
        fontColor: '#000',
        fontSize: '18px',
        fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
        fontWeight: '400',
        background: '#fff',
        shadow: '',
        wordWrap: true,
        lengthLimit: '90%',
        ...this.defaultStyle
      }
    })
    // 中奖样式
    this.$computed(this, '_activeStyle', () => {
      return {
        background: '#ffce98',
        shadow: '',
        ...this.activeStyle
      }
    })
  }

  /**
   * 初始化观察者
   */
  private initWatch (): void {
    // 监听奖品数据的变化
    this.$watch('prizes', (newData: PrizesType, oldData: PrizesType) => {
      let willUpdate: Array<PrizeImgType[] | undefined> = []
      // 首次渲染时oldData为undefined
      if (!oldData) willUpdate = newData.map(prize => prize.imgs)
      // 此时新值一定存在
      else if (newData) newData.forEach((newPrize, prizeIndex) => {
        let prizeImgs: PrizeImgType[] = []
        const oldPrize = oldData[prizeIndex]
        // 如果旧奖品不存在
        if (!oldPrize) prizeImgs = newPrize.imgs || []
        // 新奖品有图片才能进行对比
        else if (newPrize.imgs) newPrize.imgs.forEach((newImg, imgIndex) => {
          if (!oldPrize.imgs) return prizeImgs[imgIndex] = newImg
          const oldImg = oldPrize.imgs[imgIndex]
          // 如果旧值不存在
          if (!oldImg) prizeImgs[imgIndex] = newImg
          // 如果缓存中没有图片
          else if (!this.cellImgs[prizeIndex][imgIndex]) prizeImgs[imgIndex] = newImg
          // 如果新值和旧值的src不相等
          else if (newImg.src !== oldImg.src) prizeImgs[imgIndex] = newImg
        })
        willUpdate[prizeIndex] = prizeImgs
      })
      return this.init(willUpdate)
    })
    // 监听按钮数据的变化
    this.$watch('button', (newData: ButtonType, oldData: ButtonType) => {
      let willUpdate = [], btnIndex = this.cols * this.rows - 1
      // 首次渲染时, oldData不存在
      if (!oldData || !oldData.imgs) willUpdate[btnIndex] = newData.imgs
      // 如果新值存在img, 才能进行对比
      else if (newData.imgs) {
        const btnImg: ButtonImgType[] = []
        newData.imgs.forEach((newImg, imgIndex) => {
          if (!oldData.imgs) return btnImg[imgIndex] = newImg
          const oldImg = oldData.imgs[imgIndex]
          // 如果旧值不存在
          if (!oldImg) btnImg[imgIndex] = newImg
          // 如果缓存中没有图片
          else if (!this.cellImgs[btnIndex][imgIndex]) btnImg[imgIndex] = newImg
          // 如果新值和旧值的src不相等
          else if (newImg.src !== oldImg.src) btnImg[imgIndex] = newImg
        })
        willUpdate[btnIndex] = btnImg
      }
      return this.init(willUpdate)
    })
  }

  /**
   * 初始化 canvas 抽奖
   * @param willUpdateImgs 需要更新的图片
   */
  public init (willUpdateImgs: Array<CellImgType[] | undefined>): void {
    const { config, ctx, button } = this
    this.setDpr()
    this.setHTMLFontSize()
    this.zoomCanvas()
    const endCallBack = (): void => {
      // 开始首次渲染
      this.draw()
      // 中奖标识开始游走
      this.demo && this.walk()
      // 点击按钮开始, 这里不能使用 addEventListener
      if (button && config.canvasElement) config.canvasElement.onclick = e => {
        const [x, y, width, height] = this.getGeometricProperty([
          button.x,
          button.y,
          button.col || 1,
          button.row || 1
        ])
        ctx.beginPath()
        ctx.rect(x, y, width, height)
        if (!ctx.isPointInPath(e.offsetX, e.offsetY)) return
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
    let num = 0, sum = 1
    // 加载 defaultImg 默认图片
    if (this.config.flag === 'WEB') {
      let defaultImg = new Image()
      this.cellImgs[prizeIndex][imgIndex] = { defaultImg }
      defaultImg.src = imgInfo.src
      defaultImg.onload = () => {
        num++
        num === sum && callBack.call(this)
      }
    } else if (this.config.flag.indexOf('UNI-') === 0) {
      uni.getImageInfo({
        src: imgInfo.src,
        success: (imgObj: UniImageType) => {
          this.cellImgs[prizeIndex][imgIndex] = { defaultImg: imgObj }
          num++
          num === sum && callBack.call(this)
        },
        fail: () => console.error('uni.getImageInfo 加载图片失败', imgInfo.src)
      })
    }
    // 如果有 activeImg 则多加载一张
    if (!imgInfo.hasOwnProperty('activeSrc')) return
    sum++
    // 加载中奖图片
    if (this.config.flag === 'WEB') {
      let activeImg = new Image()
      this.cellImgs[prizeIndex][imgIndex].activeImg = activeImg
      activeImg.src = (imgInfo as PrizeImgType).activeSrc!
      activeImg.onload = () => {
        num++
        num === sum && callBack.call(this)
      }
    } else if (this.config.flag.indexOf('UNI-') === 0) {
      uni.getImageInfo({
        src: (imgInfo as PrizeImgType).activeSrc!,
        success: (imgObj: UniImageType) => {
          this.cellImgs[prizeIndex][imgIndex].activeImg = imgObj
          num++
          num === sum && callBack.call(this)
        },
        fail: () => console.error('uni.getImageInfo 加载图片失败', (imgInfo as PrizeImgType).activeSrc!)
      })
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
    imgObj: HTMLImageElement | UniImageType,
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
  protected draw (): void {
    const { config, ctx, _defaultConfig, _defaultStyle, _activeStyle } = this
    // 清空画布
    ctx.clearRect(0, 0, config.width, config.height)
    // 合并奖品和按钮
    this.cells = [...this.prizes]
    if (this.button) this.cells[this.cols * this.rows - 1] = this.button
    this.cells.forEach(cell => {
      cell.col = cell.col || 1
      cell.row = cell.row || 1
    })
    // 计算获取奖品区域的几何信息
    this.prizeArea = this.blocks.reduce(({x, y, w, h}, block) => {
      const [paddingTop, paddingBottom, paddingLeft, paddingRight] = computePadding(block).map(n => ~~n)
      const r = block.borderRadius ? this.getLength(block.borderRadius) : 0
      // 绘制边框
      drawRoundRect(ctx, x, y, w, h, r, this.handleBackground(x, y, w, h, block.background))
      return {
        x: x + paddingLeft,
        y: y + paddingTop,
        w: w - paddingLeft - paddingRight,
        h: h - paddingTop - paddingBottom
      }
    }, { x: 0, y: 0, w: config.width, h: config.height })
    // 计算单一奖品格子的宽度和高度
    this.cellWidth = (this.prizeArea.w - _defaultConfig.gutter * (this.cols - 1)) / this.cols
    this.cellHeight = (this.prizeArea.h - _defaultConfig.gutter * (this.rows - 1)) / this.rows
    // 绘制所有格子
    this.cells.forEach((prize, cellIndex) => {
      let [x, y, width, height] = this.getGeometricProperty([prize.x, prize.y, prize.col, prize.row])
      const isActive = cellIndex === this.currIndex % this.prizes.length >> 0
      // 处理阴影 (暂时先用any, 这里后续要优化)
      const shadow: any = (
        isActive ? _activeStyle.shadow! : (prize.shadow || _defaultStyle.shadow!)
      )
        .replace(/px/g, '') // 清空px字符串
        .split(',')[0].split(' ') // 防止有人声明多个阴影, 截取第一个阴影
        .map((n, i) => i < 3 ? Number(n) : n) // 把数组的前三个值*像素比
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
        this.getLength(prize.borderRadius ? prize.borderRadius : _defaultStyle.borderRadius),
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
        const renderImg = (isActive && cellImg.activeImg) || cellImg.defaultImg
        const [trueWidth, trueHeight] = this.computedWidthAndHeight(renderImg, imgInfo, prize)
        const [imgX, imgY] = [x + this.getOffsetX(trueWidth, prize.col), y + this.getHeight(imgInfo.top, prize.row)]
        let drawImg
        if (this.config.flag === 'WEB') {
          // 浏览器中直接绘制标签即可
          drawImg = renderImg
        } else if (this.config.flag.indexOf('UNI-') === 0) {
          // 小程序中直接绘制一个路径
          drawImg = (renderImg as UniImageType).path
        }
        ctx.drawImage(drawImg, imgX, imgY, trueWidth, trueHeight)
      })
      // 绘制文字
      prize.fonts && prize.fonts.forEach(font => {
        // 字体样式
        let style = isActive && _activeStyle.fontStyle
          ? _activeStyle.fontStyle
          : (font.fontStyle || _defaultStyle.fontStyle)
        // 字体加粗
        let fontWeight = isActive && _activeStyle.fontWeight
          ? _activeStyle.fontWeight
          : (font.fontWeight || _defaultStyle.fontWeight)
        // 字体大小
        let size = isActive && _activeStyle.fontSize
          ? this.getLength(_activeStyle.fontSize)
          : this.getLength(font.fontSize || _defaultStyle.fontSize)
        // 字体行高
        const lineHeight = isActive && _activeStyle.lineHeight
          ? _activeStyle.lineHeight
          : font.lineHeight || _defaultStyle.lineHeight || font.fontSize || _defaultStyle.fontSize
        ctx.font = `${fontWeight} ${size}px ${style}`
        ctx.fillStyle = (isActive && _activeStyle.fontColor) ? _activeStyle.fontColor : (font.fontColor || _defaultStyle.fontColor!)
        let lines = [], text = String(font.text)
        // 计算文字换行
        if (font.hasOwnProperty('wordWrap') ? font.wordWrap : _defaultStyle.wordWrap) {
          text = removeEnter(text)
          let str = ''
          for (let i = 0; i < text.length; i++) {
            str += text[i]
            let currWidth = ctx.measureText(str).width
            let maxWidth = this.getWidth(font.lengthLimit || _defaultStyle.lengthLimit, prize.col)
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
            y + this.getHeight(font.top, prize.row) + (lineIndex + 1) * this.getLength(lineHeight)
          )
        })
      })
    })
    if (ctx.draw) ctx.draw()
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
    const { ctx, _defaultStyle, _activeStyle } = this
    background = isActive ? _activeStyle.background! : (background || _defaultStyle.background!)
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
    const { clearInterval } = this
    if (this.startTime) return
    clearInterval(this.timer)
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
    const { rAF, currIndex, prizes, prizeFlag, startTime, _defaultConfig } = this
    let interval = Date.now() - startTime
    // 先完全旋转, 再停止
    if (interval >= _defaultConfig.accelerationTime && prizeFlag !== undefined) {
      // 记录帧率
      this.FPS = interval / num
      // 记录开始停止的时间戳
      this.endTime = Date.now()
      // 记录开始停止的索引
      this.stopIndex = currIndex
      // 测算最终停止的索引
      let i = 0
      while (++i) {
        const endIndex = prizes.length * i + prizeFlag - (currIndex >> 0)
        let currSpeed = quad.easeOut(this.FPS, this.stopIndex, endIndex, _defaultConfig.decelerationTime) - this.stopIndex
        if (currSpeed > _defaultConfig.speed) {
          this.endIndex = endIndex
          break
        }
      }
      return this.slowDown()
    }
    this.currIndex = (currIndex + quad.easeIn(interval, 0.1, _defaultConfig.speed, _defaultConfig.accelerationTime)) % prizes.length
    this.draw()
    rAF(this.run.bind(this, num + 1))
  }

  /**
   * 缓慢停止的方法
   */
  private slowDown (): void {
    const { rAF, prizes, prizeFlag, stopIndex, endIndex, _defaultConfig } = this
    let interval = Date.now() - this.endTime
    if (interval > _defaultConfig.decelerationTime) {
      this.startTime = 0
      this.endCallback?.({...prizes.find((prize, index) => index === prizeFlag)})
      return
    }
    this.currIndex = quad.easeOut(interval, stopIndex, endIndex, _defaultConfig.decelerationTime) % prizes.length
    this.draw()
    rAF(this.slowDown.bind(this))
  }

  /**
   * 开启中奖标识自动游走
   */
  public walk (): void {
    const { setInterval, clearInterval } = this
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
    const { cellWidth, cellHeight } = this
    const gutter = this._defaultConfig.gutter
    let res = [
      this.prizeArea!.x + (cellWidth + gutter) * x,
      this.prizeArea!.y + (cellHeight + gutter) * y
    ]
    col && row && res.push(
      cellWidth * col + gutter * (col - 1),
      cellHeight * row + gutter * (row - 1),
    )
    return res
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
    if (isExpectType(width, 'number')) return (width as number)
    if (isExpectType(width, 'string')) return this.changeUnits(
      width as string,
      this.cellWidth * col + this._defaultConfig.gutter * (col - 1)
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
    if (isExpectType(height, 'number')) return (height as number)
    if (isExpectType(height, 'string')) return this.changeUnits(
      height as string,
      this.cellHeight * row + this._defaultConfig.gutter * (row - 1)
    )
    return 0
  }

  /**
   * 获取相对(居中)X坐标
   * @param width 
   * @param col 
   */
  private getOffsetX (width: number, col = 1) {
    return (this.cellWidth * col + this._defaultConfig.gutter * (col - 1) - width) / 2
  }
}
