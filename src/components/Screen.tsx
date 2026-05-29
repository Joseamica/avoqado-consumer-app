import { type ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

type ScreenProps = {
  children: ReactNode
  /** Use 'sunk' for slightly darker bone (e.g. detail screens), 'plain' for default */
  tone?: 'plain' | 'sunk'
  /** Skip top inset when child renders its own top bar */
  edges?: { top?: boolean; bottom?: boolean }
  style?: ViewStyle
}

export function Screen({ children, tone = 'plain', edges = { top: true, bottom: false }, style }: ScreenProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.root,
        tone === 'sunk' ? styles.sunk : null,
        {
          paddingTop: edges.top ? insets.top : 0,
          paddingBottom: edges.bottom ? insets.bottom : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sunk: {
    backgroundColor: colors.backgroundDeep,
  },
})
