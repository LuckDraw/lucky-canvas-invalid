import {
  FontType,
  ImgType,
  borderRadiusType,
  backgroundType
} from './index'

export interface BlockType {
  padding?: string
  paddingTop?: string | number
  paddingRight?: string | number
  paddingBottom?: string | number
  paddingLeft?: string | number
  borderRadius?: borderRadiusType
  background?: backgroundType
}

export interface PrizeType {
  background?: backgroundType
  fonts?: Array<FontType>
  imgs?: Array<ImgType>
}

export default interface LuckyCardConfig {
  blocks?: Array<BlockType>
  prizes?: Array<PrizeType>
}
