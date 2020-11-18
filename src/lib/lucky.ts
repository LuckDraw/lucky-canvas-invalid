export default class Lucky {

  protected htmlFontSize: number = 16
  protected dpr: number = 1

  constructor () {
    // 初始化
    this.setDpr()
    this.setHTMLFontSize()
    this.resetArrayPropo()
  }

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
    this.htmlFontSize = +getComputedStyle(document.documentElement).fontSize.slice(0, -2)
  }

  /**
   * 根据 dpr 缩放 canvas 并处理位移
   * @param canvas 画布
   * @param width 将要等比缩放的宽
   * @param height 将要等比缩放的高
   */
  protected optimizeClarity (canvas: HTMLCanvasElement, width: number, height: number): void {
    const { dpr } = this
    const compute = (len: number): number => {
      return (len * dpr - len) / (len * dpr) * (dpr / 2) * 100
    }
    canvas.style.transform = `scale(${1 / dpr}) translate(
      ${-compute(width)}%, ${-compute(height)}%
    )`
  }

  /**
   * 转换单位
   * @param { string } value 将要转换的值
   * @param config 
   * @return { number } 返回新的字符串
   */
  protected changeUnits (value: string, { denominator = 1, clean = false }): number {
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
      return clean || unit === '%' ? num : num * this.dpr
    }))
  }

  /**
   * 更新数据并重新绘制 canvas 画布
   */
  public $forceUpdate () {}

  /**
   * vue2.x 响应式 - 添加一个新的响应式数据
   * @param obj 数据
   * @param key 属性
   * @param val 新值
   */
  public $set (obj: object, key: string | number, val: any) {
    this.defineReactive(obj, key, val)
    console.log(key, '使用 $set 设置', val)
  }

  /**
   * vue2.x 响应式 - 重写数组的原型方法
   */
  private resetArrayPropo () {
    const _this = this
    const oldArrayProto = Array.prototype
    const newArrayProto = Object.create(oldArrayProto)
    const methods = ['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse']
    methods.forEach(name => {
      newArrayProto[name] = function () {
        _this.$forceUpdate()
        console.log(name, '触发了 set')
        oldArrayProto[name].call(this, ...arguments)
      }
    })
  }

  /**
   * vue2.x 响应式 - 数据劫持
   * @param obj 将要处理的数据
   */
  protected observer (obj: any, params: string[] = []): void {
    if (typeof obj !== 'object' || obj === null) return
    (params.length ? params : Object.keys(obj)).forEach(key => {
      this.defineReactive(obj, key, obj[key])
    })
  }

  /**
   * vue2.x 响应式 - 重写 setter 和 getter
   * @param obj 数据
   * @param key 属性
   * @param val 值
   */
  private defineReactive (obj: object, key: string | number, val: any): void {
    const _this = this
    _this.observer(val)
    Object.defineProperty(obj, key, {
      get () {
        return val
      },
      set (newVal) {
        if (newVal !== val) {
          val = newVal
          _this.observer(val)
          _this.$forceUpdate()
          console.log(key, '<set>', val)
        }
      }
    })
  }
}
