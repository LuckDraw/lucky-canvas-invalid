export default class LuckDraw {
  protected htmlFontSize: number = 16
  protected dpr: number = 1
  constructor () {}

  /**
   * 设备像素比
   */
  protected setDpr () {
    (window as any).dpr = this.dpr = (window.devicePixelRatio || 2 ) * 1.3
  }

  /**
   * 根标签的字体大小
   */
  protected setHTMLFontSize () {
    this.htmlFontSize = +getComputedStyle(document.documentElement).fontSize.slice(0, -2)
  }

  /**
   * 根据 dpr 缩放 canvas 并处理位移
   * @param canvas 画布
   * @param width 将要等比缩放的宽
   * @param height 将要等比缩放的高
   */
  protected optimizeClarity (canvas: HTMLCanvasElement, width: number, height: number) {
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
  changeUnits (value: string, { denominator = 1, clean = false }): number {
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
}
