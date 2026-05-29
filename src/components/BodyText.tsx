import { type ReactNode } from 'react'
import { Text, type TextStyle } from 'react-native'
import { colors } from '../theme/colors'
import { type } from '../theme/typography'

type Variant = 'body' | 'bodyLarge' | 'bodySmall' | 'label' | 'labelStrong' | 'caption'

type BodyTextProps = {
  variant?: Variant
  children: ReactNode
  color?: string
  numberOfLines?: number
  align?: 'left' | 'center' | 'right'
  style?: TextStyle
}

const variants = {
  body: type.body,
  bodyLarge: type.bodyLarge,
  bodySmall: type.bodySmall,
  label: type.label,
  labelStrong: type.labelStrong,
  caption: type.caption,
} as const

export function BodyText({ variant = 'body', children, color = colors.textSubtle, numberOfLines, align = 'left', style }: BodyTextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[variants[variant], { color, textAlign: align }, style]}>
      {children}
    </Text>
  )
}
