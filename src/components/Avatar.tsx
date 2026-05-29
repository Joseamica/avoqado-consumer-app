import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { colors } from '../theme/colors'
import { type } from '../theme/typography'
import { type Vertical, accentFor } from '../theme/verticals'

type AvatarProps = {
  uri?: string | null
  fallback: string
  size?: number
  /** Sets the tint background when no image is available */
  vertical?: Vertical
  shape?: 'circle' | 'rounded'
  style?: ViewStyle
}

export function Avatar({ uri, fallback, size = 56, vertical = 'wellness', shape = 'rounded', style }: AvatarProps) {
  const accent = accentFor(vertical)
  const monogram = (fallback ?? '·').trim().slice(0, 1).toUpperCase() || '·'

  const dimensions = {
    width: size,
    height: size,
    borderRadius: shape === 'circle' ? size / 2 : Math.max(8, Math.round(size * 0.32)),
  }

  return (
    <View style={[styles.box, dimensions, { backgroundColor: accent.tint }, style]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, dimensions]} resizeMode="cover" />
      ) : (
        <Text
          style={[
            styles.monogram,
            { color: accent.deep, fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.5) },
          ]}
        >
          {monogram}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  monogram: {
    ...type.display,
  },
})
