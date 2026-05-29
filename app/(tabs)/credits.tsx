import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getConsumerCredits } from '../../src/api/client'
import type { ConsumerCreditPurchase } from '../../src/api/types'
import { Avatar } from '../../src/components/Avatar'
import { BodyText } from '../../src/components/BodyText'
import { Button } from '../../src/components/Button'
import { EmptyState } from '../../src/components/EmptyState'
import { Heading, Kicker } from '../../src/components/Heading'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { useAuthStore } from '../../src/store/authStore'
import { colors } from '../../src/theme/colors'
import { space } from '../../src/theme/spacing'
import { fontFamilies, type } from '../../src/theme/typography'
import { detectVertical } from '../../src/theme/verticals'

function formatExpiration(value?: string | null, timeZone?: string | null) {
  if (!value) return 'Sin vencimiento'
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timeZone ?? undefined,
  }).format(new Date(value))
}

function CreditPurchaseCard({ purchase, onVenuePress }: { purchase: ConsumerCreditPurchase; onVenuePress: () => void }) {
  const remaining = purchase.itemBalances.reduce((sum, item) => sum + item.remainingQuantity, 0)
  const vertical = detectVertical({
    type: null,
    name: purchase.venue.name,
    productType: purchase.itemBalances[0]?.product?.type ?? null,
  })

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={purchase.venue.logo} fallback={purchase.venue.name} vertical={vertical} size={48} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.venueName} numberOfLines={1}>
            {purchase.venue.name}
          </Text>
          <Text style={styles.packName} numberOfLines={1}>
            {purchase.creditPack.name}
          </Text>
        </View>
        <View style={styles.countWrap}>
          <Text style={styles.countNumber}>{remaining}</Text>
          <Text style={styles.countLabel}>{remaining === 1 ? 'crédito' : 'créditos'}</Text>
        </View>
      </View>

      <Text style={styles.expiration}>Vence el {formatExpiration(purchase.expiresAt, purchase.venue.timezone)}</Text>

      <View style={styles.balances}>
        {purchase.itemBalances.map(balance => (
          <View key={balance.id} style={styles.balanceRow}>
            <View style={styles.balanceText}>
              <Text style={styles.productName}>{balance.product.name}</Text>
              <Text style={styles.productMeta}>
                {balance.remainingQuantity} de {balance.originalQuantity} disponibles
              </Text>
            </View>
            <Text style={styles.balanceCount}>{balance.remainingQuantity}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onVenuePress}
        style={({ pressed }) => [styles.venueButton, pressed ? styles.pressed : null]}
      >
        <Text style={styles.venueButtonText}>Reservar aquí</Text>
        <Text style={styles.venueButtonArrow}>→</Text>
      </Pressable>
    </View>
  )
}

export default function CreditsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const token = useAuthStore(state => state.token)

  const creditsQuery = useQuery({
    queryKey: ['consumer-credits'],
    queryFn: () => getConsumerCredits(token!),
    enabled: Boolean(token),
  })

  const purchases = creditsQuery.data?.purchases ?? []
  const total = creditsQuery.data?.totalRemaining ?? 0

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Créditos" />

      <FlatList
        data={purchases}
        keyExtractor={item => item.id}
        refreshing={creditsQuery.isRefetching}
        onRefresh={() => creditsQuery.refetch()}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xxxl }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Kicker color={colors.muted}>Disponibles</Kicker>
            <View style={styles.totalRow}>
              <Heading level="hero" style={styles.totalNumber}>
                {total}
              </Heading>
              <Heading level="title" style={styles.totalLabel}>
                {total === 1 ? 'crédito' : 'créditos'}
              </Heading>
            </View>
            <BodyText color={colors.muted} style={styles.subtitle}>
              Aplicables en los lugares donde los compraste.
            </BodyText>
            {creditsQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {creditsQuery.isError ? (
              <BodyText color={colors.danger} style={styles.error}>
                No pudimos cargar tus créditos.
              </BodyText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <CreditPurchaseCard purchase={item} onVenuePress={() => router.push(`/venues/${item.venue.slug}`)} />}
        ListEmptyComponent={
          !creditsQuery.isLoading ? (
            <EmptyState
              kicker="Vacío por ahora"
              title="Sin créditos disponibles"
              description="Cuando compres paquetes de clases o servicios aparecerán aquí, listos para canjear."
              action={<Button label="Explorar lugares" onPress={() => router.replace('/')} />}
            />
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
  },
  separator: {
    height: space.md,
  },
  header: {
    paddingTop: space.xs,
    paddingBottom: space.lg,
    gap: space.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
  },
  totalNumber: {
    color: colors.accentDeep,
    fontSize: 56,
    lineHeight: 60,
  },
  totalLabel: {
    color: colors.text,
  },
  subtitle: {
    marginTop: space.xxs,
  },
  loader: {
    marginTop: space.lg,
    alignSelf: 'flex-start',
  },
  error: {
    marginTop: space.sm,
  },
  card: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  venueName: {
    ...type.subtitle,
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
  },
  packName: {
    ...type.bodySmall,
    color: colors.muted,
  },
  countWrap: {
    alignItems: 'flex-end',
  },
  countNumber: {
    ...type.number,
    color: colors.accentDeep,
    fontSize: 28,
    lineHeight: 30,
  },
  countLabel: {
    ...type.caption,
    color: colors.muted,
  },
  expiration: {
    ...type.bodySmall,
    color: colors.muted,
    fontFamily: fontFamilies.textMedium,
  },
  balances: {
    gap: space.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: 14,
    backgroundColor: colors.background,
    gap: space.sm,
  },
  balanceText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productName: {
    ...type.label,
    color: colors.text,
    fontFamily: fontFamilies.textSemibold,
  },
  productMeta: {
    ...type.bodySmall,
    color: colors.muted,
  },
  balanceCount: {
    ...type.subtitle,
    color: colors.accentDeep,
    fontFamily: fontFamilies.displayBold,
  },
  venueButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  venueButtonText: {
    ...type.button,
    color: colors.text,
    fontFamily: fontFamilies.textSemibold,
  },
  venueButtonArrow: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 22,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
})
