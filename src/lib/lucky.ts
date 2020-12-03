import { isExpectType } from '../utils/index'
import { ConfigType } from '../types/index'
export default class Lucky {
  /**
   * 公共构造器
   * @param config 
   */
  constructor (config: string | HTMLDivElement | ConfigType) {
    // 兼容代码开始: 为了处理 v1.0.6 版本在这里传入了一个 dom
    if (typeof config === 'string') config = { el: config } as ConfigType
    else if (config.nodeType === 1) config = { el: '', divElement: config } as ConfigType
    config = config as ConfigType
    // 兼容代码结束
    if (!config.flag) config.flag = 'WEB'
    if (config.el) config.divElement = document.querySelector(config.el) as HTMLDivElement
    if (config.divElement) {
      config.width = config.divElement.offsetWidth
      config.height = config.divElement.offsetHeight
      config.canvasElement = document.createElement('canvas')
      config.divElement.appendChild(config.canvasElement)
    }
    if (config.width) config.width = this.getLength(config.width)
    if (config.height) config.height = this.getLength(config.height)
    if (config.canvasElement) config.ctx = config.canvasElement.getContext('2d')!
    this.ctx = config.ctx as CanvasRenderingContext2D
    this.config = config
    // 如果最后得不到 canvas 上下文那就无法进行绘制
    if (!config.ctx || !config.width || !config.height) return
    // 初始化
    this.setDpr()
    this.setHTMLFontSize()
    this.resetArrayProto()
    this.initWindowFunction()
  }

  protected readonly config: ConfigType
  protected readonly ctx: CanvasRenderingContext2D
  protected htmlFontSize: number = 16
  protected dpr: number = 1
  private subs: object = {}
  protected rAF: Function = function () {}
  protected setTimeout: Function = function () {}
  protected setInterval: Function = function () {}
  protected clearInterval: Function = function () {}

  /**
   * 设备像素比
   */
  protected setDpr (): void {
    if (!window) return
    (window as any).dpr = this.dpr = (window.devicePixelRatio || 2 ) * 1.3
  }

  /**
   * 根标签的字体大小
   */
  protected setHTMLFontSize (): void {
    if (!window) return
    this.htmlFontSize = +window.getComputedStyle(document.documentElement).fontSize.slice(0, -2)
  }

  /**
   * 从 window 对象上获取一些方法
   */
  private initWindowFunction (): void {
    if (window) {
      this.rAF = window.requestAnimationFrame
      this.setInterval = window.setInterval
      this.clearInterval = window.clearInterval
      return
    }
    if (this.config.rAF) {
      this.rAF = this.config.rAF
    } else if (this.config.setTimeout) {
      const timeout = this.config.setTimeout
      this.rAF = (callback: Function): number => timeout(callback, 16)
    } else {
      this.rAF = (callback: Function): number => setTimeout(callback, 16)
    }
  }

  /**
   * 根据 dpr 缩放 canvas 并处理位移
   */
  protected zoomCanvas (): void {
    const { config, ctx, dpr } = this
    const { divElement, canvasElement } = config
    const compute = (len: number) => (len * dpr - len) / (len * dpr) * (dpr / 2) * 100
    if (!divElement || !canvasElement) return
    config.width = divElement.offsetWidth
    config.height = divElement.offsetHeight
    canvasElement.width = config.width * dpr
    canvasElement.height = config.height * dpr
    canvasElement.style.width = `${canvasElement.width}px`
    canvasElement.style.height = `${canvasElement.height}px`
    canvasElement.style.transform = `scale(${1 / dpr}) translate(
      ${-compute(canvasElement.width)}%, ${-compute(canvasElement.height)}%
    )`
    ctx.scale(dpr, dpr)
  }

  /**
   * 获取长度
   * @param length 将要转换的长度
   * @return 返回长度
   */
  protected getLength (length: string | number | undefined): number {
    if (isExpectType(length, 'number')) return length as number
    if (isExpectType(length, 'string')) return this.changeUnits(length as string)
    return 0
  }

  /**
   * 转换单位
   * @param { string } value 将要转换的值
   * @param { number } denominator 分子
   * @return { number } 返回新的字符串
   */
  protected changeUnits (value: string, denominator = 1): number {
    return Number(value.replace(/^(\-*[0-9.]*)([a-z%]*)$/, (value, num, unit) => {
      switch (unit) {
        case '%':
          num *= (denominator / 100)
          break
        case 'px':
          num *= 1
          break
        case 'rem':
          num *= this.htmlFontSize
          break
        case 'rpx':
          num = this.rpx2px(num)
          break
        default:
          num *= 1
          break
      }
      return num
    }))
  }

  /**
   * px 转 rpx 的方法
   * @param value 输入px
   * @return 返回rpx
   */
  px2rpx (value: string | number): number {
    if (typeof value === 'string') value = Number(value.replace(/[a-z]*/g, ''))
    if (uni) return 750 / uni.getSystemInfoSync().windowWidth * value
    if (wx) return 750 / wx.getSystemInfoSync().windowWidth * value
    return value
  }

  /**
   * rpx 转 px 的方法
   * @param value 输入rpx
   * @return 返回px
   */
  rpx2px (value: string | number): number {
    if (typeof value === 'string') value = Number(value.replace(/[a-z]*/g, ''))
    if (uni) return uni.getSystemInfoSync().windowWidth / 750 * value
    if (wx) return wx.getSystemInfoSync().windowWidth / 750 * value
    return value
  }

  /**
   * 更新数据并重新绘制 canvas 画布
   */
  protected draw () {}
  
  /**
   * 数据劫持
   * @param obj 将要处理的数据
   */
  protected observer (data: object): void {
    if (!data || typeof data !== 'object') return
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }

  /**
   * 重写 setter 和 getter
   * @param obj 数据
   * @param key 属性
   * @param val 值
   */
  private defineReactive (data: object, key: string | number, value: any): void {
    this.observer(value)
    Object.defineProperty(data, key, {
      get: () => {
        return value
      },
      set: (newVal) => {
        let oldVal = value
        if (newVal === value) return
        value = newVal
        this.observer(value)
        if (this.subs[key]) this.subs[key].call(this, value, oldVal)
        this.draw()
      }
    })
  }

  /**
   * 添加一个新的响应式数据
   * @param data 数据
   * @param key 属性
   * @param value 新值
   */
  public $set (data: object, key: string | number, value: any) {
    if (!data || typeof data !== 'object') return
    this.defineReactive(data, key, value)
  }

  /**
   * 添加一个属性计算
   * @param data 源数据
   * @param key 属性名
   * @param callback 回调函数
   */
  protected $computed (data: object, key: string, callback: Function) {
    Object.defineProperty(data, key, {
      get: () => {
        return callback.call(this)
      }
    })
  }

  /**
   * 添加一个观察者
   * @param key 属性名
   * @param callback 回调函数
   */
  protected $watch (key: string, callback: Function) {
    this.subs[key] = callback
  }

  /**
   * 重写数组的原型方法
   */
  private resetArrayProto () {
    const _this = this
    const oldArrayProto = Array.prototype
    const newArrayProto = Object.create(oldArrayProto)
    const methods = ['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse']
    methods.forEach(name => {
      newArrayProto[name] = function () {
        _this.draw()
        oldArrayProto[name].call(this, ...Array.from(arguments))
      }
    })
  }
}
