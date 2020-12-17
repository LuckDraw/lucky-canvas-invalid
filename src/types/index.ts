// 字体类型
export interface FontType {
  text: string
  top?: string | number
  fontColor?: string
  fontSize?: string
  fontStyle?: string
  fontWeight?: string
  lineHeight?: string
}

// 图片类型
export interface ImgType {
  src: string
  top?: string | number
  width?: string
  height?: string
  $resolve?: Function
}

export interface ConfigType {
  // 临时处理元素类型, 当版本升到4.x之后就可以删掉了
  nodeType: number
  // 配置
  flag: 'WEB' | 'MINI-WX' | 'UNI-H5' | 'UNI-MINI-WX'
  el?: string
  divElement?: HTMLDivElement
  canvasElement?: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dpr: number
  width: number
  height: number
  unitFunc?: (num: number, unit: string) => number
  // 覆盖方法
  rAF?: Function
  setTimeout?: Function
  setInterval: Function
  clearInterval: Function
  // 组件生命周期
  beforeDraw?: Function
  afterDraw?: Function
}

export interface UniImageType {
  path: string
  width: number
  height: number
}
