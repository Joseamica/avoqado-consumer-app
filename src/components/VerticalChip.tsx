import { Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/colors'
import { type } from '../theme/typography'
import { accentFor, type Vertical } from '../theme/verticals'

type VerticalChipProps = {
  vertical: Vertical | 'all'
  label: string
  active?: boolean
  onPress: () => void
}

export function VerticalChip({ vertical, label, active = false, onPress }: VerticalChipProps) {
  const accent = vertical === 'all' ? null : accentFor(vertical)
  const activeBg = vertical === 'all' ? colors.text : accent?.ink ?? colors.text
  const activeFg = colors.surface
  const idleBg = colors.surface
  const idleFg = colors.text

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? activeBg : idleBg, borderColor: active ? activeBg : colors.border },
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.label, { color: active ? activeFg : idleFg }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...type.label,
    letterSpacing: 0,
  },
})
