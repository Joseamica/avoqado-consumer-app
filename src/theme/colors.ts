/**
 * Avoqado palette — warm bone surfaces, deep forest accent, terracotta highlight.
 * Never pure black or pure white; every neutral is tinted toward the brand hue.
 */
export const colors = {
  background: '#F6F1E8',
  backgroundDeep: '#EFE7D8',
  surface: '#FFFFFF',
  surfaceMuted: '#EDE5D5',
  surfaceSunk: '#E5DCC8',
  text: '#1E1C18',
  textSubtle: '#3F3A33',
  muted: '#6F6A60',
  mutedSoft: '#8E8779',
  border: '#DED6C5',
  borderStrong: '#C5BBA6',
  primary: '#1F4D3A',
  primaryPressed: '#173A2C',
  primaryTint: '#DCE5DD',
  accent: '#C7834A',
  accentDeep: '#A86733',
  accentTint: '#F4E2D2',
  ink: '#1E1C18',
  inkTint: '#E8E2D4',
  danger: '#A33A2F',
  dangerTint: '#F2D9D5',
  success: '#2F6A48',
  successTint: '#DDEAE0',
  warning: '#A66A1B',
  warningTint: '#F8E6C8',
  overlay: 'rgba(30, 28, 24, 0.42)',
  shadow: 'rgba(50, 38, 22, 0.22)',
} as const

export type ColorToken = keyof typeof colors
