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
}

export interface ConfigType {
  nodeType: number
  el?: string
  divElement?: HTMLDivElement
  canvasElement?: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  rAF?: Function
  setTimeout?: Function
  setInterval: Function
  clearInterval: Function
  flag: 'WEB' | 'MINI-WX' | 'UNI-H5' | 'UNI-MINI-WX'
}
