import { type ReactNode } from 'react'
import { StyleSheet, Text, type TextStyle } from 'react-native'
import { colors } from '../theme/colors'
import { type } from '../theme/typography'

type HeadingLevel = 'hero' | 'display' | 'title' | 'subtitle'

type HeadingProps = {
  level?: HeadingLevel
  children: ReactNode
  color?: string
  numberOfLines?: number
  style?: TextStyle
  align?: 'left' | 'center' | 'right'
}

const levelStyles = {
  hero: type.hero,
  display: type.display,
  title: type.title,
  subtitle: type.subtitle,
} as const

export function Heading({ level = 'display', children, color = colors.text, numberOfLines, style, align = 'left' }: HeadingProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[levelStyles[level], { color, textAlign: align }, style]}
      accessibilityRole="header"
    >
      {children}
    </Text>
  )
}

export function Kicker({ children, color = colors.muted, style }: { children: ReactNode; color?: string; style?: TextStyle }) {
  return <Text style={[type.kicker, { color }, styles.kickerSpacing, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  kickerSpacing: {
    marginBottom: 8,
  },
})
