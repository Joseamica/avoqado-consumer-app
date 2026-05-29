import { type ReactNode } from 'react'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { colors } from '../theme/colors'
import { type } from '../theme/typography'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'ink'

type PillProps = {
  label: string
  tone?: Tone
  size?: 'sm' | 'md'
  leading?: ReactNode
  style?: ViewStyle
}

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textSubtle },
  success: { bg: colors.successTint, fg: colors.success },
  warning: { bg: colors.warningTint, fg: colors.warning },
  danger: { bg: colors.dangerTint, fg: colors.danger },
  accent: { bg: colors.accentTint, fg: colors.accentDeep },
  ink: { bg: colors.inkTint, fg: colors.ink },
}

export function Pill({ label, tone = 'neutral', size = 'md', leading, style }: PillProps) {
  const palette = tones[tone]
  return (
    <View
      style={[
        styles.pill,
        size === 'sm' ? styles.pillSm : styles.pillMd,
        { backgroundColor: palette.bg },
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <Text style={[type.caption, { color: palette.fg }, styles.label]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  pillSm: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  leading: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
})
