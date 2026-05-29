import { Platform, type ViewStyle } from 'react-native'
import { colors } from './colors'

/**
 * Warm shadows — never cool gray. The shadow color is tinted with the same
 * warm neutral as the palette so cards lift gently instead of flooring hard.
 */
export const shadows = {
  none: {} as ViewStyle,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 4 },
    default: {},
  })!,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 14 },
    },
    android: { elevation: 8 },
    default: {},
  })!,
  pressed: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.6,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 1 },
    default: {},
  })!,
} as const
