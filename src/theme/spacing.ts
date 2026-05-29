/**
 * 4-based spacing scale. Use named tokens at component level — never raw numbers.
 * Avoid uniform spacing; create rhythm by mixing tight + airy across hierarchies.
 */
export const space = {
  px: 1,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 44,
  huge: 64,
  giant: 96,
} as const

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const

export type SpaceToken = keyof typeof space
export type RadiusToken = keyof typeof radius
