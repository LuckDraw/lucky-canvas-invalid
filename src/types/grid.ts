import {
  FontType,
  ImgType,
  borderRadiusType,
  backgroundType,
  shadowType
} from './index'

export interface PrizeFontType extends FontType {
  wordWrap?: boolean
  lengthLimit?: string | number
}

export interface ButtonFontType extends FontType {
  wordWrap?: boolean
  lengthLimit?: string | number
}

export type CellFontType = PrizeFontType | ButtonFontType

export interface BlockImgType extends ImgType {}

export interface PrizeImgType extends ImgType {
  activeSrc?: string
}

export interface ButtonImgType extends ImgType {}

export type CellImgType = PrizeImgType | ButtonImgType

export interface BlockType {
  borderRadius?: borderRadiusType
  background?: backgroundType
  padding?: string
  paddingTop?: string | number
  paddingRight?: string | number
  paddingBottom?: string | number
  paddingLeft?: string | number
  imgs?: Array<BlockImgType>
}

export interface CellType<T, U> {
  x: number
  y: number
  col: number
  row: number
  borderRadius?: borderRadiusType
  background: backgroundType
  shadow?: shadowType
  fonts?: Array<T>
  imgs?: Array<U>
}

export type PrizeType = CellType<PrizeFontType, PrizeImgType>

export type ButtonType = CellType<ButtonFontType, ButtonImgType>

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
  fontColor?: PrizeFontType['fontColor']
  fontSize?: PrizeFontType['fontSize']
  fontStyle?: PrizeFontType['fontStyle']
  fontWeight?: PrizeFontType['fontWeight']
  lineHeight?: PrizeFontType['lineHeight']
  wordWrap?: PrizeFontType['wordWrap']
  lengthLimit?: PrizeFontType['lengthLimit']
}

export interface ActiveStyleType {
  background?: backgroundType
  shadow?: shadowType
  fontColor?: PrizeFontType['fontColor']
  fontSize?: PrizeFontType['fontSize']
  fontStyle?: PrizeFontType['fontStyle']
  fontWeight?: PrizeFontType['fontWeight']
  lineHeight?: PrizeFontType['lineHeight']
}

export type RowsType = number
export type ColsType = number
export type StartCallbackType = (e: MouseEvent) => void
export type EndCallbackType = (prize: object) => void

export default interface LuckyGridConfig {
  rows?: RowsType
  cols?: ColsType
  blocks?: Array<BlockType>
  prizes?: Array<PrizeType>
  buttons?: Array<ButtonType>
  button?: ButtonType
  defaultConfig?: DefaultConfigType
  defaultStyle?: DefaultStyleType
  activeStyle?: ActiveStyleType
  start?: StartCallbackType
  end?: EndCallbackType
}
