
import LuckyWheelConfig, {
  BlockType,
  PrizeType,
  ButtonType,
  DefaultConfigType,
  DefaultStyleType,
  StartCallbackType,
} from '../types/wheel'
import LuckDraw from './index'
import {
  isExpectType,
  // removeEnter,
} from '../utils/index'
import {
  getAngle,
  // drawSector,
} from '../utils/math'

export class LuckyWheel extends LuckDraw {

  private readonly blocks: Array<BlockType>
  private readonly prizes: Array<PrizeType>
  private readonly buttons: Array<ButtonType>
  private readonly defaultConfig: DefaultConfigType = {
    gutter: '0px',
    offsetDegree: 0,
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500,
  }
  private readonly defaultStyle: DefaultStyleType = {
    fontSize: '18px',
    fontColor: '#000',
    fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
    fontWeight: '400',
    background: '#fff',
    wordWrap: true,
    lengthLimit: '90%',
  }
  private readonly startCallback?: StartCallbackType
  private readonly box: Element
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private Radius: number = 0
  private prizeRadius: number = 0
  private prizeDeg: number = 0
  private prizeRadian: number = 0
  private maxBtnRadius: number = 0
  private startTime: number = 0

  /**
   * 构造器
   * @param el 元素标识
   * @param data 抽奖配置项
   */
  constructor (el: string, data: LuckyWheelConfig = {}) {
    super()
    this.box = document.querySelector(el) as Element
    this.canvas = document.createElement('canvas')
    this.box.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.blocks = data?.blocks || []
    this.prizes = data?.prizes || []
    this.buttons = data?.buttons || []
    for (let key in data?.defaultConfig) {
      this.defaultConfig[key] = data?.defaultConfig[key]
    }
    for (let key in data?.defaultStyle) {
      this.defaultStyle[key] = data?.defaultStyle[key]
    }
    this.init([])
  }

  /**
   * 初始化 canvas 抽奖
   * @param { Array<Array<img>> } willUpdateImgs 需要更新的图片
   */
  public init (willUpdateImgs: object[][]) {
    this.setDpr()
    this.setHTMLFontSize()
    const { box, canvas, ctx, dpr } = this
    if (!box) return
    canvas.width = canvas.height = (box as HTMLDivElement).offsetWidth * dpr
    this.Radius = canvas.width / 2
    this.optimizeClarity(canvas, this.Radius * 2, this.Radius * 2)
    ctx.translate(this.Radius, this.Radius)
    const endCallBack = () => {
      // 开始绘制
      this.draw()
      // 防止多次绑定点击事件
      canvas.onclick = e => {
        ctx.beginPath()
        ctx.arc(0, 0, this.maxBtnRadius, 0, Math.PI * 2, false)
        if (!ctx.isPointInPath(e.offsetX, e.offsetY)) return
        if (this.startTime) return
        this.startCallback?.(e)
      }
    }
    // 同步加载图片
    let num = 0, sum = 0
    // if (isExpectType(willUpdateImgs, 'array')) {
    //   this.draw() // 先画一次防止闪烁, 因为加载图片是异步的
    //   willUpdateImgs.forEach((imgs, cellIndex) => {
    //     if (!imgs) return false
    //     imgs.forEach((imgInfo, imgIndex) => {
    //       sum++
    //       this.loadAndCacheImg(cellIndex, imgIndex, () => {
    //         num++
    //         if (sum === num) endCallBack.call(this)
    //       })
    //     })
    //   })
    // }
    if (!sum) endCallBack.call(this)
  }

  /**
   * 单独加载某一张图片并计算其实际渲染宽高
   * @param { number } cellIndex 奖品索引
   * @param { number } imgIndex 奖品图片索引
   * @param { Function } callBack 图片加载完毕回调
   */
  // loadAndCacheImg (cellIndex: number, imgIndex: number, callBack: () => void) {
  //   // 先判断index是奖品图片还是按钮图片, 并修正index的值
  //   const isPrize = cellIndex < (this.config.prizes?.length as number)
  //   const cellName = isPrize ? 'prizes' : 'buttons'
  //   const imgName = isPrize ? 'prizeImgs' : 'btnImgs'
  //   cellIndex = isPrize ? cellIndex : cellIndex - this.prizes.length
  //   // 获取图片信息
  //   const cell = this[cellName][cellIndex]
  //   if (!cell) return false
  //   const imgInfo = cell.imgs[imgIndex]
  //   if (!imgInfo) return false
  //   // 创建图片
  //   let imgObj = new Image()
  //   if (!this[imgName][cellIndex]) this[imgName][cellIndex] = []
  //   // 创建缓存
  //   this[imgName][cellIndex][imgIndex] = imgObj
  //   imgObj.src = imgInfo.src
  //   imgObj.onload = () => callBack.call(this)
  // }

  /**
   * 开始绘制
   */
  draw () {
    const { ctx, dpr } = this
    // const { _defaultStyle, _defaultConfig } = config
    ctx.clearRect(-this.Radius, -this.Radius, this.Radius * 2, this.Radius * 2)
    // 绘制blocks边框
    this.prizeRadius = this.blocks.reduce((radius, block) => {
      ctx.beginPath()
      ctx.fillStyle = block.background
      ctx.arc(0, 0, radius, 0, Math.PI * 2, false)
      ctx.fill()
      return radius - this.getLength(block.padding.split(' ')[0]) * dpr
    }, this.Radius)
    // 计算起始弧度
    this.prizeDeg = 360 / this.prizes.length
    this.prizeRadian = getAngle(this.prizeDeg)
  }

  /**
   * 获取长度
   */
  getLength (length: string | number): number {
    if (isExpectType(length, 'number')) return length as number
    if (isExpectType(length, 'string')) return this.changeUnits(
      length as string, { clean: true }
    )
    return 0
  }
}
