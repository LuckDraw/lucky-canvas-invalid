import { FontType, ImgType } from './index'

export interface PrizeFontType extends FontType {
  wordWrap?: boolean
  lengthLimit?: string | number
}

export interface ButtonFontType extends FontType {}

export interface BlockImgType extends ImgType {
  rotate?: boolean
}

export interface PrizeImgType extends ImgType {}

export interface ButtonImgType extends ImgType {}

export interface BlockType {
  background: string
  padding: string
  imgs?: Array<BlockImgType>
}

export interface PrizeType {
  background?: string
  fonts?: Array<PrizeFontType>
  imgs?: Array<PrizeImgType>
}

export interface ButtonType {
  radius?: string
  pointer?: boolean
  background?: string
  fonts?: Array<ButtonFontType>
  imgs?: Array<ButtonImgType>
}

export interface DefaultConfigType {
  gutter?: string | number
  offsetDegree?: number
  speed?: number
  speedFunction?: string
  accelerationTime?: number
  decelerationTime?: number
  stopRange?: number
}

export interface DefaultStyleType {
  background?: string
  fontColor?: PrizeFontType['fontColor']
  fontSize?: PrizeFontType['fontSize']
  fontStyle?: PrizeFontType['fontStyle']
  fontWeight?: PrizeFontType['fontWeight']
  lineHeight?: PrizeFontType['lineHeight']
  wordWrap?: PrizeFontType['wordWrap']
  lengthLimit?: PrizeFontType['lengthLimit']
}

export type StartCallbackType = (e: MouseEvent) => void
export type EndCallbackType = (prize: object) => void

export default interface LuckyWheelConfig {
  blocks?: Array<BlockType>
  prizes?: Array<PrizeType>
  buttons?: Array<ButtonType>
  defaultConfig?: DefaultConfigType
  defaultStyle?: DefaultStyleType
  start?: StartCallbackType
  end?: EndCallbackType
}
