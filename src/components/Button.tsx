import { type ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'
import { fontFamilies, type } from '../theme/typography'

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse'
type Size = 'md' | 'sm' | 'lg'

type ButtonProps = {
  label: string
  onPress: () => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  accessibilityLabel?: string
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth = true,
  leading,
  trailing,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const indicatorColor =
    variant === 'primary' || variant === 'inverse' ? colors.surface : colors.text

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizes[size],
        variantStyles[variant].container,
        fullWidth ? styles.fullWidth : null,
        pressed && !isDisabled ? variantStyles[variant].pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <View style={styles.content}>
          {leading ? <View style={styles.icon}>{leading}</View> : null}
          <Text style={[styles.label, sizeLabels[size], variantStyles[variant].label]}>{label}</Text>
          {trailing ? <View style={styles.icon}>{trailing}</View> : null}
        </View>
      )}
    </Pressable>
  )
}

const sizes = StyleSheet.create({
  sm: { minHeight: 40, borderRadius: 14, paddingHorizontal: 16 },
  md: { minHeight: 52, borderRadius: 18, paddingHorizontal: 20 },
  lg: { minHeight: 60, borderRadius: 22, paddingHorizontal: 24 },
})

const sizeLabels = StyleSheet.create({
  sm: { fontSize: 14, lineHeight: 18 },
  md: { fontSize: 16, lineHeight: 20 },
  lg: { fontSize: 17, lineHeight: 22 },
})

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.button,
    fontFamily: fontFamilies.textSemibold,
  },
  disabled: {
    opacity: 0.45,
  },
})

const variantStyles: Record<
  Variant,
  { container: any; pressed: any; label: any }
> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
    },
    pressed: {
      backgroundColor: colors.primaryPressed,
    },
    label: {
      color: colors.surface,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    label: {
      color: colors.text,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    label: {
      color: colors.text,
    },
  },
  inverse: {
    container: {
      backgroundColor: colors.ink,
    },
    pressed: {
      backgroundColor: '#000',
    },
    label: {
      color: colors.surface,
    },
  },
}
