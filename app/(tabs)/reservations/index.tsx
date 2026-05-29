import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getReservations } from '../../../src/api/client'
import type { ConsumerReservation } from '../../../src/api/types'
import { Avatar } from '../../../src/components/Avatar'
import { BodyText } from '../../../src/components/BodyText'
import { Button } from '../../../src/components/Button'
import { EmptyState } from '../../../src/components/EmptyState'
import { Heading, Kicker } from '../../../src/components/Heading'
import { Pill } from '../../../src/components/Pill'
import { ScreenHeader } from '../../../src/components/ScreenHeader'
import { useAuthStore } from '../../../src/store/authStore'
import { colors } from '../../../src/theme/colors'
import { space } from '../../../src/theme/spacing'
import { fontFamilies, type } from '../../../src/theme/typography'
import { detectVertical } from '../../../src/theme/verticals'

function formatReservationTime(reservation: ConsumerReservation) {
  const start = new Date(reservation.startsAt)
  const end = new Date(reservation.endsAt)
  const timeZone = reservation.venue.timezone ?? undefined
  const date = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(start)
  const time = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone })}`
  return { date, time }
}

function statusInfo(reservation: ConsumerReservation): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (reservation.status === 'CANCELLED') return { label: 'Cancelada', tone: 'danger' }
  if (reservation.depositAmount && reservation.depositStatus !== 'PAID') return { label: 'Pendiente de pago', tone: 'warning' }
  if (reservation.status === 'CONFIRMED') return { label: 'Confirmada', tone: 'success' }
  return { label: 'Pendiente', tone: 'neutral' }
}

function ReservationCard({ reservation, onPress }: { reservation: ConsumerReservation; onPress: () => void }) {
  const status = statusInfo(reservation)
  const { date, time } = formatReservationTime(reservation)
  const vertical = detectVertical({
    type: null,
    name: reservation.venue.name,
    productType: reservation.product?.type ?? null,
  })

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.cardHeader}>
        <Avatar uri={reservation.venue.logo} fallback={reservation.venue.name} vertical={vertical} size={52} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.venueName} numberOfLines={1}>
            {reservation.venue.name}
          </Text>
          <Text style={styles.productName} numberOfLines={1}>
            {reservation.product?.name ?? 'Reserva'}
          </Text>
        </View>
        <Pill label={status.label} tone={status.tone} size="sm" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.dateText} numberOfLines={1}>
          {date}
        </Text>
        <Text style={styles.timeText} numberOfLines={1}>
          {time}
        </Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {reservation.partySize} {reservation.partySize === 1 ? 'persona' : 'personas'} · {reservation.confirmationCode}
        </Text>
      </View>
    </Pressable>
  )
}

export default function ReservationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const token = useAuthStore(state => state.token)

  const reservationsQuery = useQuery({
    queryKey: ['consumer-reservations'],
    queryFn: () => getReservations(token!),
    enabled: Boolean(token),
  })

  const upcoming = reservationsQuery.data?.upcoming ?? []
  const past = reservationsQuery.data?.past ?? []

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Mis reservas" />

      <FlatList
        data={upcoming}
        keyExtractor={item => item.confirmationCode}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xxxl }]}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        refreshing={reservationsQuery.isRefetching}
        onRefresh={() => reservationsQuery.refetch()}
        ListHeaderComponent={
          <View style={styles.header}>
            <Kicker color={colors.muted}>Próximas</Kicker>
            <Heading level="display">Tus reservas</Heading>
            {reservationsQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {reservationsQuery.isError ? (
              <BodyText color={colors.danger} style={styles.error}>
                No pudimos cargar tus reservas.
              </BodyText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ReservationCard
            reservation={item}
            onPress={() =>
              router.push({
                pathname: '/reservations/[cancelSecret]',
                params: { cancelSecret: item.cancelSecret, venueSlug: item.venue.slug },
              })
            }
          />
        )}
        ListEmptyComponent={
          !reservationsQuery.isLoading ? (
            <EmptyState
              kicker="Vacío por ahora"
              title="No tienes reservas próximas"
              description="Cuando reserves una cita o clase aparecerá aquí — sin notificaciones de spam."
              action={<Button label="Buscar un lugar" onPress={() => router.replace('/')} />}
            />
          ) : null
        }
        ListFooterComponent={
          past.length > 0 ? (
            <View style={styles.pastSection}>
              <View style={styles.divider} />
              <Kicker color={colors.muted}>Pasadas</Kicker>
              <Heading level="title" style={styles.pastTitle}>
                Recientes
              </Heading>
              <View style={styles.pastList}>
                {past.slice(0, 10).map(item => (
                  <ReservationCard
                    key={item.confirmationCode}
                    reservation={item}
                    onPress={() =>
                      router.push({
                        pathname: '/reservations/[cancelSecret]',
                        params: { cancelSecret: item.cancelSecret, venueSlug: item.venue.slug },
                      })
                    }
                  />
                ))}
              </View>
            </View>
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
    gap: space.sm,
  },
  itemSeparator: {
    height: space.sm,
  },
  header: {
    paddingTop: space.xs,
    paddingBottom: space.lg,
    gap: space.xxs,
  },
  loader: {
    marginTop: space.lg,
    alignSelf: 'flex-start',
  },
  error: {
    marginTop: space.sm,
  },
  card: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
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
  productName: {
    ...type.bodySmall,
    color: colors.muted,
  },
  cardBody: {
    gap: 2,
  },
  dateText: {
    ...type.label,
    color: colors.muted,
    fontFamily: fontFamilies.textMedium,
    textTransform: 'capitalize',
  },
  timeText: {
    ...type.title,
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
  },
  metaText: {
    ...type.bodySmall,
    color: colors.muted,
    marginTop: 4,
  },
  pastSection: {
    paddingTop: space.xl,
    gap: space.xxs,
  },
  pastTitle: {
    marginBottom: space.sm,
  },
  pastList: {
    gap: space.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: space.lg,
  },
})
