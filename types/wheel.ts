import { FontType, ImgType } from './index'

export interface BlockType {
  background: string
  padding: string
}

export interface PrizeType {
  background?: string
  fonts?: Array<FontType>
  imgs?: Array<ImgType>
}

export interface ButtonType {
  radius?: string
  pointer?: boolean
  background?: string
  fonts?: Array<FontType>
  imgs?: Array<ImgType>
}

export interface DefaultConfigType {
  gutter?: string | number
  offsetDegree?: number
  speed?: number
  accelerationTime?: number
  decelerationTime?: number
}

export interface DefaultStyleType {
  background?: string
  fontColor?: FontType['fontColor']
  fontSize?: FontType['fontSize']
  fontStyle?: FontType['fontStyle']
  fontWeight?: FontType['fontWeight']
  lineHeight?: FontType['lineHeight']
  wordWrap?: FontType['wordWrap']
  lengthLimit?: FontType['lengthLimit']
}

export default interface LuckyWheelConfig {
  blocks?: Array<BlockType>
  prizes?: Array<PrizeType>
  buttons?: Array<ButtonType>
  defaultConfig?: DefaultConfigType
  defaultStyle?: DefaultStyleType
  start?: (e: MouseEvent) => void
  end?: (prize: object) => void
}
