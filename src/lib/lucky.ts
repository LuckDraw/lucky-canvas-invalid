import { isExpectType } from '../utils/index'
import { ConfigType, ImgType, UniImageType } from '../types/index'
import { name, version } from '../../package.json'

export default class Lucky {
  /**
   * 公共构造器
   * @param config 
   */
  constructor (config: string | HTMLDivElement | ConfigType) {
    this.setDpr()
    this.setHTMLFontSize()
    // 兼容代码开始: 为了处理 v1.0.6 版本在这里传入了一个 dom
    if (typeof config === 'string') config = { el: config } as ConfigType
    else if (config.nodeType === 1) config = { el: '', divElement: config } as ConfigType
    config = config as ConfigType
    // 兼容代码结束
    if (!config.flag) config.flag = 'WEB'
    if (config.flag.indexOf('UNI-') === 0) {
      this.global = uni
    } else if (config.flag === 'MINI-WX') {
      this.global = wx
    }
    if (config.el) config.divElement = document.querySelector(config.el) as HTMLDivElement
    let boxWidth = 0, boxHeight = 0
    if (config.divElement) {
      boxWidth = config.divElement.offsetWidth
      boxHeight = config.divElement.offsetHeight
      config.canvasElement = document.createElement('canvas')
      config.divElement.appendChild(config.canvasElement)
    }
    // 宽高优先从config里取, 其次从style上面取
    config.width = this.getLength(config.width) || boxWidth
    config.height = this.getLength(config.height) || boxHeight
    // 重新把宽高赋给盒子
    if (config.divElement) {
      config.divElement.style.width = config.width + 'px'
      config.divElement.style.height = config.height + 'px'
    }
    if (config.canvasElement) {
      // 添加版本信息到标签上, 方便定位版本问题
      config.canvasElement.setAttribute('package', `${name}@${version}`)
      config.ctx = config.canvasElement.getContext('2d')!
    }
    this.ctx = config.ctx as CanvasRenderingContext2D
    this.config = config
    // 如果最后得不到 canvas 上下文那就无法进行绘制
    if (!config.ctx || !config.width || !config.height) {
      console.error('无法获取到 CanvasContext2D 或宽高')
      return
    }
    this.resetArrayProto()
    this.initWindowFunction()
  }

  protected readonly config: ConfigType
  protected readonly ctx: CanvasRenderingContext2D
  protected global = {}
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
    if (window) {
      (window as any).dpr = this.dpr = (window.devicePixelRatio || 2 ) * 1.3
    } else {
      this.dpr = this.config.dpr!
    }
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
      // 优先使用帧动画
      this.rAF = this.config.rAF
    } else if (this.config.setTimeout) {
      // 其次使用定时器
      const timeout = this.config.setTimeout
      this.rAF = (callback: Function): number => timeout(callback, 16)
    } else {
      // 如果config里面没有提供, 那就假设全局方法存在setTimeout
      this.rAF = (callback: Function): number => setTimeout(callback, 16)
    }
  }

  /**
   * 根据 dpr 缩放 canvas 并处理位移
   */
  protected zoomCanvas (): void {
    const { config, ctx, dpr } = this
    const { canvasElement } = config
    const compute = (len: number) => (len * dpr - len) / (len * dpr) * (dpr / 2) * 100
    if (!canvasElement) return
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
   * 异步加载图片并返回图片的几何信息
   * @param src 图片路径
   * @param info 图片信息
   */
  protected loadImg (src: string, info: ImgType) {
    return new Promise(resolve => {
      if (this.config.flag === 'WEB') {
        let imgObj = new Image()
        imgObj.src = src
        imgObj.onload = () => resolve(imgObj)
      } else if (['MINI-WX', 'UNI-H5', 'UNI-MINI-WX'].includes(this.config.flag)) {
        // 修复 uni.getImageInfo 无法处理 base64 格式的图片的问题
        if (/^data:image\/([a-z]+);base64,/.test(src)) {
          info.$resolve = resolve
          return
        }
        this.global.getImageInfo({
          src: src,
          success: (imgObj: UniImageType) => resolve(imgObj),
          fail: () => console.error('API `getImageInfo` 加载图片失败', src)
        })
      }
    })
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
    const { global } = this
    if (typeof value === 'string') value = Number(value.replace(/[a-z]*/g, ''))
    if (!global) return value
    return 750 / global.getSystemInfoSync().windowWidth * value
  }

  /**
   * rpx 转 px 的方法
   * @param value 输入rpx
   * @return 返回px
   */
  rpx2px (value: string | number): number {
    const { global } = this
    if (typeof value === 'string') value = Number(value.replace(/[a-z]*/g, ''))
    if (!global) return value
    return global.getSystemInfoSync().windowWidth / 750 * value
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
