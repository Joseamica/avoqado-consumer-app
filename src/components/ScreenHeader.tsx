import { type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'
import { space } from '../theme/spacing'
import { fontFamilies, type } from '../theme/typography'

type ScreenHeaderProps = {
  title?: string
  onBack?: () => void
  right?: ReactNode
  align?: 'left' | 'center'
}

const HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 }

export function ScreenHeader({ title, onBack, right, align = 'left' }: ScreenHeaderProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBack}
            hitSlop={HIT_SLOP}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.backGlyph}>←</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.titleWrap, align === 'center' ? styles.titleCenter : null]}>
        {title ? (
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right ?? null}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  right: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: space.xs,
  },
  titleCenter: {
    alignItems: 'center',
  },
  title: {
    ...type.labelStrong,
    color: colors.text,
    fontFamily: fontFamilies.textSemibold,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backGlyph: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: fontFamilies.textMedium,
    marginTop: -1,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
})
