import { isExpectType } from '../utils/index'
export default class Lucky {
  constructor (el: string | HTMLDivElement) {
    this.setDpr()
    this.setHTMLFontSize()
    this.resetArrayPropo()
    this.box = typeof el === 'string'
      ? document.querySelector(el) as HTMLDivElement : el
    this.canvas = document.createElement('canvas')
    this.box.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
  }

  protected readonly box: HTMLDivElement
  protected readonly canvas: HTMLCanvasElement
  protected readonly ctx: CanvasRenderingContext2D
  protected boxWidth: number = 0
  protected boxHeight: number = 0
  protected htmlFontSize: number = 16
  protected dpr: number = 1
  private subs: object = {}

  /**
   * 设备像素比
   */
  protected setDpr (): void {
    (window as any).dpr = this.dpr = (window.devicePixelRatio || 2 ) * 1.3
  }

  /**
   * 根标签的字体大小
   */
  protected setHTMLFontSize (): void {
    this.htmlFontSize = +window.getComputedStyle(document.documentElement).fontSize.slice(0, -2)
  }

  /**
   * 根据 dpr 缩放 canvas 并处理位移
   */
  protected zoomCanvas (): void {
    const { box, canvas, ctx, dpr } = this
    const compute = (len: number) => (len * dpr - len) / (len * dpr) * (dpr / 2) * 100
    this.boxWidth = box.offsetWidth
    this.boxHeight = box.offsetHeight
    canvas.width = this.boxWidth * dpr
    canvas.height = this.boxHeight * dpr
    canvas.style.width = `${canvas.width}px`
    canvas.style.height = `${canvas.height}px`
    canvas.style.transform = `scale(${1 / dpr}) translate(
      ${-compute(canvas.width)}%, ${-compute(canvas.height)}%
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
        default:
          num *= 1
          break
      }
      return num
    }))
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
  private resetArrayPropo () {
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
