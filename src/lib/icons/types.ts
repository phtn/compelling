import { ClassName } from '@/types'
import { IconNameType } from './icons'

export type IconList = Record<IconNameType, { viewBox: string; symbol: string }>

export type IconName = IconNameType

export interface IconProps {
  name: IconName
  className?: ClassName
  size?: number
  color?: string
  solid?: boolean
  onClick?: VoidFunction
}

export interface IconData {
  symbol: string
  set: string
  viewBox?: string
}
