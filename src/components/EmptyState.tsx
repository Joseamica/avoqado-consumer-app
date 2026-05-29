import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from '../theme/colors'
import { space } from '../theme/spacing'
import { BodyText } from './BodyText'
import { Heading, Kicker } from './Heading'

type EmptyStateProps = {
  kicker?: string
  title: string
  description?: string
  action?: ReactNode
  variant?: 'card' | 'plain'
}

export function EmptyState({ kicker, title, description, action, variant = 'card' }: EmptyStateProps) {
  return (
    <View style={[styles.wrap, variant === 'card' ? styles.card : styles.plain]}>
      {kicker ? <Kicker color={colors.muted}>{kicker}</Kicker> : null}
      <Heading level="subtitle">{title}</Heading>
      {description ? (
        <BodyText variant="body" color={colors.muted} style={styles.description}>
          {description}
        </BodyText>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs,
  },
  card: {
    padding: space.lg,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  plain: {
    paddingVertical: space.md,
  },
  description: {
    marginTop: 2,
  },
  action: {
    marginTop: space.sm,
  },
})
