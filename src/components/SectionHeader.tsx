import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from '../theme/colors'
import { space } from '../theme/spacing'
import { Heading, Kicker } from './Heading'

type SectionHeaderProps = {
  kicker?: string
  kickerColor?: string
  title: string
  /** Right-side accessory (count, badge, action) */
  trailing?: ReactNode
  level?: 'subtitle' | 'title'
}

export function SectionHeader({ kicker, kickerColor = colors.muted, title, trailing, level = 'subtitle' }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {kicker ? <Kicker color={kickerColor}>{kicker}</Kicker> : null}
        <Heading level={level}>{title}</Heading>
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
  },
  text: {
    flex: 1,
  },
  trailing: {
    paddingBottom: 4,
  },
})
