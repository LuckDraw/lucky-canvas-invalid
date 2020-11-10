
import LuckDraw from './index'
import LuckyGridConfig, {
  RowsType,
  ColsType,
  BlockType,
  CellType,
  DefaultConfigType,
  DefaultStyleType,
  ActiveStyleType,
  StartCallbackType,
  EndCallbackType,
} from '../types/grid'
import { FontType, ImgType } from '../types/index'
import { isExpectType, removeEnter, computePadding } from '../utils/index'
import { drawRoundRect, getLinearGradient, } from '../utils/math'
import { quad } from '../utils/tween'

export class LuckyGrid extends LuckDraw {

  private readonly rows: RowsType
  private readonly cols: ColsType
  private readonly blocks: Array<BlockType>
  private readonly prizes: Array<CellType>
  private readonly button?: CellType
  private readonly defaultConfig: DefaultConfigType = {
    gutter: 5,
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500,
  }
  private readonly defaultStyle: DefaultStyleType = {
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
  private readonly activeStyle: ActiveStyleType = {
    background: '#ffce98',
    shadow: '',
  }
  private readonly startCallback?: StartCallbackType
  private readonly endCallback?: EndCallbackType
  private readonly box: HTMLDivElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private boxWidth = 0                  // 九宫格宽度
  private boxHeight = 0                 // 九宫格高度
  private cellWidth = 0                 // 格子宽度
  private cellHeight = 0                // 格子高度
  private startTime = 0                 // 开始时间戳
  private currIndex = 0                 // 当前index累加
  private demo = false                  // 是否自动游走
  private timer = 0                     // 游走定时器
  private animationId = 0               // 帧动画id
  private prizeFlag: number | undefined // 中奖索引
  private cells: Array<CellType> = []   // 所有格子
  private cellImgs: Array<HTMLImageElement[]> = [[]]
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
    // 收集首次渲染的图片
    let willUpdate: Array<ImgType[] | undefined> = [[]]
    this.prizes && (willUpdate = this.prizes.map(prize => prize.imgs))
    this.button && (willUpdate[this.cols * this.rows - 1] = this.button.imgs)
    this.init(willUpdate)
  }

  /**
   * 初始化 canvas 抽奖
   * @param { Array<ImgType[]> } willUpdateImgs 需要更新的图片
   */
  public init (willUpdateImgs: Array<ImgType[] | undefined>): void {
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

  draw () {}

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
