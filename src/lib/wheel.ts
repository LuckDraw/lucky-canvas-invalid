import Lucky from './lucky'
import { ConfigType } from '../types/index'
import LuckyWheelConfig, {
  PrizeFontType, PrizeImgType,
  ButtonFontType, ButtonImgType,
  PrizeType, ButtonType,
  BlockType,
  DefaultConfigType,
  DefaultStyleType,
  StartCallbackType,
  EndCallbackType
} from '../types/wheel'
import { FontType, ImgType, UniImageType } from '../types/index'
import { isExpectType, removeEnter } from '../utils/index'
import { getAngle, drawSector } from '../utils/math'
import { quad } from '../utils/tween'

export default class LuckyWheel extends Lucky {
  /**
   * 大转盘构造器
   * @param config 元素标识
   * @param data 抽奖配置项
   */
  constructor (config: string | HTMLDivElement | ConfigType, data: LuckyWheelConfig = {}) {
    super(config)
    this.initData(data)
    this.initComputed()
    this.initWatch()
    // 收集首次渲染的图片
    let willUpdate: Array<ImgType[] | undefined> = [[]]
    this.prizes && ( willUpdate = this.prizes.map(prize => prize.imgs))
    this.buttons && (willUpdate.push(...this.buttons.map(btn => btn.imgs)))
    this.init(willUpdate)
  }

  private blocks: Array<BlockType> = []
  private prizes: Array<PrizeType> = []
  private buttons: Array<ButtonType> = []
  private defaultConfig: DefaultConfigType = {}
  private _defaultConfig = {
    gutter: '0px',
    offsetDegree: 0,
    speed: 20,
    accelerationTime: 2500,
    decelerationTime: 2500,
  }
  private defaultStyle: DefaultStyleType = {}
  private _defaultStyle = {
    fontSize: '18px',
    fontColor: '#000',
    fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
    fontWeight: '400',
    lineHeight: '',
    background: '#fff',
    wordWrap: true,
    lengthLimit: '90%',
  }
  private startCallback?: StartCallbackType
  private endCallback?: EndCallbackType
  private Radius = 0                    // 大转盘半径
  private prizeRadius = 0               // 奖品区域半径
  private prizeDeg = 0                  // 奖品数学角度
  private prizeRadian = 0               // 奖品运算角度
  private rotateDeg = 0                 // 转盘旋转角度
  private maxBtnRadius = 0              // 最大按钮半径
  private startTime = 0                 // 开始时间戳
  private endTime = 0                   // 停止时间戳
  private stopDeg = 0                   // 刻舟求剑
  private endDeg = 0                    // 停止角度
  private prizeFlag: number | undefined // 中奖索引
  private animationId = 0               // 帧动画id
  private FPS = 16.6                    // 屏幕刷新率
  private prizeImgs: Array<HTMLImageElement[] | UniImageType[]> = [[]]
  private btnImgs: Array<HTMLImageElement[] | UniImageType[]> = [[]]

  /**
   * 初始化数据
   * @param data 
   */
  private initData (data: LuckyWheelConfig): void {
    this.$set(this, 'blocks', data.blocks || [])
    this.$set(this, 'prizes', data.prizes || [])
    this.$set(this, 'buttons', data.buttons || [])
    this.$set(this, 'defaultConfig', data.defaultConfig || {})
    this.$set(this, 'defaultStyle', data.defaultStyle || {})
    this.$set(this, 'startCallback', data.start)
    this.$set(this, 'endCallback', data.end)
  }

  /**
   * 初始化属性计算
   */
  private initComputed () {
    // 默认配置
    this.$computed(this, '_defaultConfig', () => {
      const config = {
        gutter: '0px',
        offsetDegree: 0,
        speed: 20,
        accelerationTime: 2500,
        decelerationTime: 2500,
        ...this.defaultConfig
      }
      return config
    })
    // 默认样式
    this.$computed(this, '_defaultStyle', () => {
      const style = {
        fontSize: '18px',
        fontColor: '#000',
        fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
        fontWeight: '400',
        background: '#fff',
        wordWrap: true,
        lengthLimit: '90%',
        ...this.defaultStyle
      }
      return style
    })
  }

  /**
   * 初始化观察者
   */
  private initWatch () {
    // 观察奖品数据的变化
    this.$watch('prizes', (newData: Array<PrizeType>, oldData: Array<PrizeType>) => {
      let willUpdate: Array<ImgType[] | undefined> = []
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
          // 如果缓存中没有奖品或图片
          else if (!this.prizeImgs[prizeIndex] || !this.prizeImgs[prizeIndex][imgIndex]) {
            prizeImgs[imgIndex] = newImg
          }
          // 如果新值和旧值的src不相等
          else if (newImg.src !== oldImg.src) prizeImgs[imgIndex] = newImg
        })
        willUpdate[prizeIndex] = prizeImgs
      })
      return this.init(willUpdate)
    })
    // 观察按钮数据的变化
    this.$watch('buttons', (newData: Array<ButtonType>, oldData: Array<ButtonType>) => {
      let willUpdate: Array<ImgType[] | undefined> = []
      // 首次渲染时oldData为undefined
      if (!oldData) willUpdate = newData.map(btn => btn.imgs)
      // 此时新值一定存在
      else if (newData) newData.forEach((newBtn, btnIndex) => {
        let btnImgs: ButtonImgType[] = []
        const oldBtn = oldData[btnIndex]
        // 如果旧奖品不存在或旧奖品的图片不存在
        if (!oldBtn || !oldBtn.imgs) btnImgs = newBtn.imgs || []
        // 新奖品有图片才能进行对比
        else if (newBtn.imgs) newBtn.imgs.forEach((newImg, imgIndex) => {
          if (!oldBtn.imgs) return btnImgs[imgIndex] = newImg
          const oldImg = oldBtn.imgs[imgIndex]
          // 如果旧值不存在
          if (!oldImg) btnImgs[imgIndex] = newImg
          // 如果缓存中没有按钮或图片
          else if (!this.btnImgs[btnIndex] || !this.btnImgs[btnIndex][imgIndex]) {
            btnImgs[imgIndex] = newImg
          }
          // 如果新值和旧值的src不相等
          else if (newImg.src !== oldImg.src) btnImgs[imgIndex] = newImg
        })
        willUpdate[btnIndex] = btnImgs
      })
      return this.init([...new Array(this.prizes.length).fill(undefined), ...willUpdate])
    })
  }

  /**
   * 初始化 canvas 抽奖
   * @param { Array<ImgType[]> } willUpdateImgs 需要更新的图片
   */
  public init (willUpdateImgs: Array<ImgType[] | undefined>): void {
    const { config, ctx } = this
    this.setDpr()
    this.setHTMLFontSize()
    this.zoomCanvas()
    // 初始化前回调函数
    config.beforeInit?.call(this)
    this.Radius = Math.min(config.width, config.height) / 2
    ctx.translate(this.Radius, this.Radius)
    const endCallBack = (): void => {
      this.draw()
      // 防止多次绑定点击事件
      if (config.canvasElement) config.canvasElement.onclick = e => {
        ctx.beginPath()
        ctx.arc(0, 0, this.maxBtnRadius, 0, Math.PI * 2, false)
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
    // 初始化后回调函数
    config.afterInit?.call(this)
  }

  /**
   * 单独加载某一张图片并计算其实际渲染宽高
   * @param { number } cellIndex 奖品索引
   * @param { number } imgIndex 奖品图片索引
   * @param { Function } callBack 图片加载完毕回调
   */
  private async loadAndCacheImg (
    cellIndex: number,
    imgIndex: number,
    callBack: () => void
  ) {
    // 先判断index是奖品图片还是按钮图片, 并修正index的值
    const isPrize = cellIndex < this.prizes.length
    const cellName = isPrize ? 'prizes' : 'buttons'
    const imgName = isPrize ? 'prizeImgs' : 'btnImgs'
    cellIndex = isPrize ? cellIndex : cellIndex - this.prizes.length
    // 获取图片信息
    const cell: PrizeType | ButtonType = this[cellName][cellIndex]
    if (!cell || !cell.imgs) return
    const imgInfo = cell.imgs[imgIndex]
    if (!imgInfo) return
    // 同步加载图片
    if (!this[imgName][cellIndex]) this[imgName][cellIndex] = []
    this[imgName][cellIndex][imgIndex] = await this.loadImg(imgInfo.src, imgInfo)
    callBack.call(this)
  }

  /**
   * 计算图片的渲染宽高
   * @param imgObj 图片标签元素
   * @param imgInfo 图片信息
   * @param computedWidth 宽度百分比
   * @param computedHeight 高度百分比
   * @return [渲染宽度, 渲染高度]
   */
  private computedWidthAndHeight (
    imgObj: HTMLImageElement | UniImageType,
    imgInfo: ImgType,
    computedWidth: number,
    computedHeight: number
  ): [number, number] {
    // 根据配置的样式计算图片的真实宽高
    if (!imgInfo.width && !imgInfo.height) {
      // 如果没有配置宽高, 则使用图片本身的宽高
      return [imgObj.width, imgObj.height]
    } else if (imgInfo.width && !imgInfo.height) {
      // 如果只填写了宽度, 没填写高度
      let trueWidth = this.getWidth(imgInfo.width, computedWidth)
      // 那高度就随着宽度进行等比缩放
      return [trueWidth, imgObj.height * (trueWidth / imgObj.width)]
    } else if (!imgInfo.width && imgInfo.height) {
      // 如果只填写了宽度, 没填写高度
      let trueHeight = this.getHeight(imgInfo.height, computedHeight)
      // 那宽度就随着高度进行等比缩放
      return [imgObj.width * (trueHeight / imgObj.height), trueHeight]
    }
    // 如果宽度和高度都填写了, 就如实计算
    return [
      this.getWidth(imgInfo.width, computedWidth),
      this.getHeight(imgInfo.height, computedHeight)
    ]
  }

  /**
   * 开始绘制
   */
  protected draw (): void {
    const { config, ctx, _defaultConfig, _defaultStyle } = this
    // 触发绘制前回调
    config.beforeDraw?.call(this, ctx)
    // 清空画布
    ctx.clearRect(-this.Radius, -this.Radius, this.Radius * 2, this.Radius * 2)
    // 绘制blocks边框
    this.prizeRadius = this.blocks.reduce((radius, block) => {
      ctx.beginPath()
      ctx.fillStyle = block.background
      ctx.arc(0, 0, radius, 0, Math.PI * 2, false)
      ctx.fill()
      return radius - this.getLength(block.padding.split(' ')[0])
    }, this.Radius)
    // 计算起始弧度
    this.prizeDeg = 360 / this.prizes.length
    this.prizeRadian = getAngle(this.prizeDeg)
    let start = getAngle(-90 + this.rotateDeg + _defaultConfig.offsetDegree)
    // 计算文字横坐标
    const getFontX = (line: string) => {
      return this.getOffsetX(ctx.measureText(line).width)
    }
    // 计算文字纵坐标
    const getFontY = (font: FontType, height: number, lineIndex: number) => {
      // 优先使用字体行高, 要么使用默认行高, 其次使用字体大小, 否则使用默认字体大小
      const lineHeight = font.lineHeight || _defaultStyle.lineHeight || font.fontSize || _defaultStyle.fontSize
      return this.getHeight(font.top, height) + (lineIndex + 1) * this.getLength(lineHeight)
    }
    ctx.save()
    // 绘制prizes奖品区域
    this.prizes.forEach((prize, prizeIndex) => {
      // 计算当前奖品区域中间坐标点
      let currMiddleDeg = start + prizeIndex * this.prizeRadian
      // 奖品区域可见高度
      let prizeHeight = this.prizeRadius - this.maxBtnRadius
      // 绘制背景
      drawSector(
        config.flag, ctx,
        this.maxBtnRadius, this.prizeRadius,
        currMiddleDeg - this.prizeRadian / 2,
        currMiddleDeg + this.prizeRadian / 2,
        this.getLength(_defaultConfig.gutter),
        prize.background || _defaultStyle.background
      )
      // 计算临时坐标并旋转文字
      let x = Math.cos(currMiddleDeg) * this.prizeRadius
      let y = Math.sin(currMiddleDeg) * this.prizeRadius
      ctx.translate(x, y)
      ctx.rotate(currMiddleDeg + getAngle(90))
      // 绘制图片
      prize.imgs && prize.imgs.forEach((imgInfo, imgIndex) => {
        if (!this.prizeImgs[prizeIndex]) return
        const prizeImg = this.prizeImgs[prizeIndex][imgIndex]
        if (!prizeImg) return
        const [trueWidth, trueHeight] = this.computedWidthAndHeight(
          prizeImg, imgInfo, this.prizeRadian * this.prizeRadius, prizeHeight
        )
        const [imgX, imgY] = [this.getOffsetX(trueWidth), this.getHeight(imgInfo.top, prizeHeight)]
        let drawImg
        // 兼容代码
        if (['WEB', 'MINI-WX'].includes(this.config.flag)) {
          drawImg = prizeImg
        } else if (['UNI-H5', 'UNI-MINI-WX'].includes(this.config.flag)) {
          drawImg = (prizeImg as UniImageType).path
        }
        // 绘制图片
        ctx.drawImage((drawImg as CanvasImageSource), imgX, imgY, trueWidth, trueHeight)
      })
      // 逐行绘制文字
      prize.fonts && prize.fonts.forEach(font => {
        let fontColor = font.fontColor || _defaultStyle.fontColor
        let fontWeight = font.fontWeight || _defaultStyle.fontWeight
        let fontSize = this.getLength(font.fontSize || _defaultStyle.fontSize)
        let fontStyle = font.fontStyle || _defaultStyle.fontStyle
        ctx.fillStyle = fontColor!
        ctx.font = `${fontWeight} ${fontSize}px ${fontStyle}`
        let lines = [], text = String(font.text)
        if (font.hasOwnProperty('wordWrap') ? font.wordWrap : _defaultStyle.wordWrap) {
          text = removeEnter(text)
          let str = ''
          for (let i = 0; i < text.length; i++) {
            str += text[i]
            let currWidth = ctx.measureText(str).width
            let maxWidth = (this.prizeRadius - getFontY(font, prizeHeight, lines.length))
              * Math.tan(this.prizeRadian / 2) * 2 - this.getLength(_defaultConfig.gutter)
            if (currWidth > this.getWidth(font.lengthLimit || _defaultStyle.lengthLimit, maxWidth)) {
              lines.push(str.slice(0, -1))
              str = text[i]
            }
          }
          if (str) lines.push(str)
          if (!lines.length) lines.push(text)
        } else {
          lines = text.split('\n')
        }
        lines.filter(line => !!line).forEach((line, lineIndex) => {
          ctx.fillText(line, getFontX(line), getFontY(font, prizeHeight, lineIndex))
        })
      })
      // 修正旋转角度和原点坐标
      ctx.rotate(getAngle(360) - currMiddleDeg - getAngle(90))
      ctx.translate(-x, -y)
    })
    ctx.restore()
    // 绘制按钮
    this.buttons.forEach((btn, btnIndex) => {
      let radius = this.getHeight(btn.radius)
      // 绘制背景颜色
      this.maxBtnRadius = Math.max(this.maxBtnRadius, radius)
      ctx.beginPath()
      ctx.fillStyle = btn.background || '#fff'
      ctx.arc(0, 0, radius, 0, Math.PI * 2, false)
      ctx.fill()
      // 绘制指针
      if (btn.pointer) {
        ctx.beginPath()
        ctx.fillStyle = btn.background || '#fff'
        ctx.moveTo(-radius, 0)
        ctx.lineTo(radius, 0)
        ctx.lineTo(0, -radius * 2)
        ctx.closePath()
        ctx.fill()
      }
      // 绘制按钮图片
      btn.imgs && btn.imgs.forEach((imgInfo, imgIndex) => {
        if (!this.btnImgs[btnIndex]) return
        const btnImg = this.btnImgs[btnIndex][imgIndex]
        if (!btnImg) return
        // 计算图片真实宽高
        const [trueWidth, trueHeight] = this.computedWidthAndHeight(
          btnImg, imgInfo, this.getHeight(btn.radius) * 2, this.getHeight(btn.radius) * 2
        )
        const [imgX, imgY] = [this.getOffsetX(trueWidth), this.getHeight(imgInfo.top, radius)]
        // 兼容代码
        let drawImg
        if (['WEB', 'MINI-WX'].includes(this.config.flag)) {
          drawImg = btnImg
        } else if (['UNI-H5', 'UNI-MINI-WX'].includes(this.config.flag)) {
          drawImg = (btnImg as UniImageType).path
        }
        // 绘制图片
        ctx.drawImage((drawImg as CanvasImageSource), imgX, imgY, trueWidth, trueHeight)
      })
      // 绘制按钮文字
      btn.fonts && btn.fonts.forEach(font => {
        let fontColor = font.fontColor || _defaultStyle.fontColor
        let fontWeight = font.fontWeight || _defaultStyle.fontWeight
        let fontSize = this.getLength(font.fontSize || _defaultStyle.fontSize)
        let fontStyle = font.fontStyle || _defaultStyle.fontStyle
        ctx.fillStyle = fontColor!
        ctx.font = `${fontWeight} ${fontSize}px ${fontStyle}`
        String(font.text).split('\n').forEach((line, lineIndex) => {
          ctx.fillText(line, getFontX(line), getFontY(font, radius, lineIndex))
        })
      })
    })
    // 触发绘制后回调
    config.afterDraw?.call(this, ctx)
  }

  /**
   * 对外暴露: 开始抽奖方法
   */
  public play (): void {
    // 再次拦截, 因为play是可以异步调用的
    if (this.startTime) return
    this.startTime = Date.now()
    this.prizeFlag = undefined
    this.run()
  }

  /**
   * 对外暴露: 缓慢停止方法
   * @param index 中奖索引
   */
  public stop (index: string | number): void {
    this.prizeFlag = Number(index) % this.prizes.length
  }

  /**
   * 实际开始执行方法
   * @param num 记录帧动画执行多少次
   */
  private run (num: number = 0): void {
    const { rAF, prizeFlag, prizeDeg, rotateDeg, _defaultConfig } = this
    let interval = Date.now() - this.startTime
    // 先完全旋转, 再停止
    if (interval >= _defaultConfig.accelerationTime && prizeFlag !== undefined) {
      // 记录帧率
      this.FPS = interval / num
      // 记录开始停止的时间戳
      this.endTime = Date.now()
      // 记录开始停止的位置
      this.stopDeg = rotateDeg
      // 测算最终停止的角度
      let i = 0
      while (++i) {
        const endDeg = 360 * i - prizeFlag * prizeDeg - rotateDeg - _defaultConfig.offsetDegree
        let currSpeed = quad.easeOut(this.FPS, this.stopDeg, endDeg, _defaultConfig.decelerationTime) - this.stopDeg
        if (currSpeed > _defaultConfig.speed) {
          this.endDeg = endDeg
          break
        }
      }
      return this.slowDown()
    }
    this.rotateDeg = (rotateDeg + quad.easeIn(interval, 0, _defaultConfig.speed, _defaultConfig.accelerationTime)) % 360
    this.draw()
    rAF(this.run.bind(this, num + 1))
  }

  /**
   * 缓慢停止的方法
   */
  private slowDown (): void {
    const { rAF, prizes, prizeFlag, stopDeg, endDeg, _defaultConfig } = this
    let interval = Date.now() - this.endTime
    if (interval >= _defaultConfig.decelerationTime) {
      this.startTime = 0
      this.endCallback?.({...prizes.find((prize, index) => index === prizeFlag)})
      return
    }
    this.rotateDeg = quad.easeOut(interval, stopDeg, endDeg, _defaultConfig.decelerationTime) % 360
    this.draw()
    rAF(this.slowDown.bind(this))
  }

  /**
   * 获取相对宽度
   * @param length 将要转换的宽度
   * @param width 宽度计算百分比
   * @return 返回相对宽度
   */
  private getWidth (
    length: string | number | undefined,
    width = this.prizeRadian * this.prizeRadius
  ): number {
    if (isExpectType(length, 'number')) return (length as number)
    if (isExpectType(length, 'string')) return this.changeUnits(length as string, width)
    return 0
  }

  /**
   * 获取相对高度
   * @param length 将要转换的高度
   * @param height 高度计算百分比
   * @return 返回相对高度
   */
  private getHeight (
    length: string | number | undefined,
    height = this.prizeRadius
  ): number {
    if (isExpectType(length, 'number')) return (length as number)
    if (isExpectType(length, 'string')) return this.changeUnits(length as string, height)
    return 0
  }

  /**
   * 获取相对(居中)X坐标
   * @param width
   * @return 返回x坐标
   */
  private getOffsetX (width: number): number {
    return -width / 2
  }
}
