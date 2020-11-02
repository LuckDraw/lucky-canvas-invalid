import { FontType, ImgType } from './index'

interface BlockType {
  background: string
  padding: string
}

interface PrizeType {
  background?: string
  fonts?: Array<FontType>
  imgs?: Array<ImgType>
}

interface ButtonType {
  background?: string
  fonts?: Array<FontType>
  imgs?: Array<ImgType>
}

interface defaultConfigType {
  gutter?: string | number
  offsetDegree?: number
  speed?: number
  accelerationTime?: number
  decelerationTime?: number
}

interface defaultStyleType {
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
  defaultConfig?: defaultConfigType
  defaultStyle?: defaultStyleType
  play?: () => void
  stop?: (index: number | string) => void
}
