import { Platform, type TextStyle } from 'react-native'

/**
 * Type system: Fraunces (display) for editorial moments + Geist (text) for UI.
 * Both load via @expo-google-fonts at app boot. Until they finish loading we fall
 * back to platform serif/sans so layout never thrashes.
 */
export const fontFamilies = {
  display: Platform.select({
    ios: 'Fraunces_500Medium',
    android: 'Fraunces_500Medium',
    default: 'Fraunces_500Medium',
  }) as string,
  displayBold: Platform.select({
    ios: 'Fraunces_600SemiBold',
    android: 'Fraunces_600SemiBold',
    default: 'Fraunces_600SemiBold',
  }) as string,
  displayItalic: 'Fraunces_500Medium_Italic',
  text: 'Geist_400Regular',
  textMedium: 'Geist_500Medium',
  textSemibold: 'Geist_600SemiBold',
  textBold: 'Geist_700Bold',
} as const

const baseLetter = -0.2

/**
 * Type scale — modular, fluid where possible. Display sizes use Fraunces with
 * tight leading; UI sizes use Geist with comfortable leading.
 */
export const type = {
  // Editorial display (Fraunces)
  hero: {
    fontFamily: fontFamilies.display,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.6,
  } satisfies TextStyle,
  display: {
    fontFamily: fontFamilies.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  // UI text (Geist)
  body: {
    fontFamily: fontFamilies.text,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: baseLetter,
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily: fontFamilies.text,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: baseLetter,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: fontFamilies.text,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamilies.textMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  } satisfies TextStyle,
  labelStrong: {
    fontFamily: fontFamilies.textSemibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamilies.textSemibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamilies.textMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  kicker: {
    fontFamily: fontFamilies.textMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  number: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
  } satisfies TextStyle,
} as const

export type TypeToken = keyof typeof type
