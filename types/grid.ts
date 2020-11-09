import { FontType, ImgType } from './index'

type borderRadiusType =  string | number
type backgroundType = string
type shadowType = string

export interface BlockType {
  borderRadius?: borderRadiusType
  background: backgroundType
  padding: string
  paddingTop?: string | number
  paddingRight?: string | number
  paddingBottom?: string | number
  paddingLeft?: string | number
}

export interface CellType {
  x: number
  y: number
  col: number
  row: number
  borderRadius?: borderRadiusType
  background: backgroundType
  shadow?: shadowType
  fonts?: Array<FontType>
  imgs?: Array<ImgType>
}

export interface DefaultConfigType {
  gutter?: number
  speed?: number
  accelerationTime?: number
  decelerationTime?: number
}

export interface DefaultStyleType {
  borderRadius?: borderRadiusType
  background?: backgroundType
  shadow?: shadowType
  fontColor?: FontType['fontColor']
  fontSize?: FontType['fontSize']
  fontStyle?: FontType['fontStyle']
  fontWeight?: FontType['fontWeight']
  wordWrap?: FontType['wordWrap']
  lengthLimit?: FontType['lengthLimit']
}

export interface ActiveStyleType {
  background?: backgroundType
  shadow?: shadowType
  fontColor?: FontType['fontColor']
  fontSize?: FontType['fontSize']
  fontStyle?: FontType['fontStyle']
  fontWeight?: FontType['fontWeight']
}

export type StartCallbackType = (e: MouseEvent) => void
export type EndCallbackType = (prize: object) => void

export default interface LuckyGridConfig {
  rows?: string | number
  cols?: string | number
  blocks?: Array<BlockType>
  prizes?: Array<CellType>
  button?: CellType
  defaultConfig?: DefaultConfigType
  defaultStyle?: DefaultStyleType
  activeStyle?: ActiveStyleType
  start?: StartCallbackType
  end?: EndCallbackType
}
