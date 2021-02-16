import Lucky from './lucky'
import { ConfigType, UniImageType } from '../types/index'
import LuckyCardConfig, {
  BlockType,
  PrizeType
} from '../types/card'
import { isExpectType, computePadding, hasBackground } from '../utils/index'
import { drawRoundRect } from '../utils/math'

export default class LuckyCard extends Lucky {
  private blocks: Array<BlockType> = []
  private prizes: Array<PrizeType> = []
  // 鼠标是否按下
  private isMouseDown: boolean = false
  private prevCanvas: string = ''
  // 奖品区域几何信息
  private prizeArea: { x: number, y: number, w: number, h: number } = {
    x: 0, y: 0, w: 0, h: 0
  }

  /**
   * 刮刮乐构造器
   * @param config 
   * @param data 
   */
  constructor (config: ConfigType, data: LuckyCardConfig = {}) {
    super(config)
    this.initData(data)
    this.init()
  }
  initData (data: LuckyCardConfig) {
    this.$set(this, 'blocks', data.blocks || [])
    this.$set(this, 'prizes', data.prizes || [])
  }
  init () {
    const { config, ctx } = this
    this.setDpr()
    this.setHTMLFontSize()
    this.zoomCanvas()
    this.draw()
  }
  draw () {
    const { config, ctx } = this
    ctx.globalCompositeOperation = 'source-over'
    // 计算奖品区域
    this.prizeArea = this.blocks.reduce(({x, y, w, h}, block) => {
      const [paddingTop, paddingBottom, paddingLeft, paddingRight] = computePadding(block)
      const r = block.borderRadius ? this.getLength(block.borderRadius) : 0
      // 绘制边框
      const background = block.background || ''
      if (hasBackground(background)) {
        drawRoundRect(ctx, x, y, w, h, r, background)
      }
      return {
        x: x + paddingLeft,
        y: y + paddingTop,
        w: w - paddingLeft - paddingRight,
        h: h - paddingTop - paddingBottom
      }
    }, { x: 0, y: 0, w: config.width, h: config.height })
    // 开始绘制奖品
    this.prizes.forEach((prize, prizeIndex) => {
      const { x, y, w, h } = this.prizeArea
      const background = prize.background || ''
      if (hasBackground(background)) {
        drawRoundRect(ctx, x, y, w, h, 0, background)
      }
    })
    ctx.globalCompositeOperation = 'destination-out'
  }

  /**
   * 鼠标移动事件
   * @param e 事件参数
   */
  handleMouseMove (e: MouseEvent): void {
    if (!this.isMouseDown) return
    const { ctx } = this
    ctx.beginPath()
    const radius = 20
    const [x, y] = this.conversionAxis(e.offsetX, e.offsetY)
    // ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2)
    drawRoundRect(ctx, x - radius, y - radius, radius * 2, radius * 2, 15, '#ccc')
    ctx.fill()
    console.log(x, y)
  }

  /**
   * 鼠标按下事件
   * @param e 事件参数
   */
  handleMouseDown (e: MouseEvent): void {
    this.isMouseDown = true
  }

  /**
   * 鼠标抬起事件
   * @param e 事件参数
   */
  handleMouseUp (e: MouseEvent): void {
    this.isMouseDown = false
  }

  /**
   * 换算渲染坐标
   * @param x
   * @param y
   */
  protected conversionAxis (x: number, y: number): [number, number] {
    const { config } = this
    return [x / config.dpr, y / config.dpr]
  }
}
