import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  cancelReservation,
  createReservationDepositCheckout,
  finalizeReservationDepositCheckout,
  getReservationDetail,
} from '../../../src/api/client'
import { Avatar } from '../../../src/components/Avatar'
import { BodyText } from '../../../src/components/BodyText'
import { Button } from '../../../src/components/Button'
import { Heading, Kicker } from '../../../src/components/Heading'
import { Pill } from '../../../src/components/Pill'
import { ScreenHeader } from '../../../src/components/ScreenHeader'
import { useAuthStore } from '../../../src/store/authStore'
import { colors } from '../../../src/theme/colors'
import { space } from '../../../src/theme/spacing'
import { fontFamilies, type } from '../../../src/theme/typography'
import { detectVertical } from '../../../src/theme/verticals'

function formatMoney(amount?: number | string | null) {
  if (amount == null) return null
  const parsed = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(parsed)) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parsed)
}

function formatDate(value?: string, timeZone?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timeZone ?? undefined,
  }).format(new Date(value))
}

function formatTimeRange(startsAt?: string, endsAt?: string, timeZone?: string | null) {
  if (!startsAt || !endsAt) return ''
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timeZone ?? undefined })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timeZone ?? undefined })}`
}

function statusCopy(status?: string, depositStatus?: string | null, depositAmount?: number | string | null): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (status === 'CANCELLED') return { label: 'Cancelada', tone: 'danger' }
  if (depositAmount && depositStatus !== 'PAID') return { label: 'Pendiente de pago', tone: 'warning' }
  if (status === 'CONFIRMED') return { label: 'Confirmada', tone: 'success' }
  return { label: 'Pendiente', tone: 'neutral' }
}

function getPaymentStatusFromReturnUrl(url?: string) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.searchParams.get('payment')
  } catch {
    const match = /[?&]payment=([^&]+)/.exec(url)
    return match ? decodeURIComponent(match[1]) : null
  }
}

function getSessionIdFromReturnUrl(url?: string) {
  if (!url) return null
  const marker = 'session_id='
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const end = rest.indexOf('&')
  return end === -1 ? decodeURIComponent(rest) : decodeURIComponent(rest.slice(0, end))
}

function PanelLabel({ children }: { children: string }) {
  return <Text style={styles.panelLabel}>{children}</Text>
}

export default function ReservationDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const token = useAuthStore(state => state.token)
  const { cancelSecret, venueSlug, backTo } = useLocalSearchParams<{ cancelSecret: string; venueSlug?: string; backTo?: string }>()
  const resolvedVenueSlug = venueSlug ?? ''

  const goBackOrHome = () => {
    if (backTo === 'reservations') {
      router.replace('/reservations')
      return
    }
    if (router.canGoBack()) router.back()
    else router.replace('/reservations')
  }

  const reservationQuery = useQuery({
    queryKey: ['reservation-detail', resolvedVenueSlug, cancelSecret],
    queryFn: () => getReservationDetail(resolvedVenueSlug, cancelSecret),
    enabled: Boolean(resolvedVenueSlug && cancelSecret),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelReservation(resolvedVenueSlug, cancelSecret, 'Cancelada desde app consumer'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservation-detail', resolvedVenueSlug, cancelSecret] }),
        queryClient.invalidateQueries({ queryKey: ['consumer-reservations'] }),
      ])
      Alert.alert('Reserva cancelada', 'La reserva fue cancelada correctamente.')
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Intenta de nuevo.'
      Alert.alert('No pudimos cancelar', message)
    },
  })

  const payMutation = useMutation({
    mutationFn: () => createReservationDepositCheckout(token!, resolvedVenueSlug, cancelSecret),
    onSuccess: async checkout => {
      const paymentResult = await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, 'avoqado://payment-result')
      const paymentStatus = getPaymentStatusFromReturnUrl((paymentResult as any).url)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservation-detail', resolvedVenueSlug, cancelSecret] }),
        queryClient.invalidateQueries({ queryKey: ['consumer-reservations'] }),
      ])

      if (paymentStatus === 'success') {
        const sessionId = getSessionIdFromReturnUrl((paymentResult as any).url)
        let finalized: Awaited<ReturnType<typeof finalizeReservationDepositCheckout>> | null = null
        try {
          finalized = sessionId && token ? await finalizeReservationDepositCheckout(token, sessionId) : null
        } catch {
          finalized = null
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reservation-detail', resolvedVenueSlug, cancelSecret] }),
          queryClient.invalidateQueries({ queryKey: ['consumer-reservations'] }),
        ])
        if (finalized?.depositStatus === 'PAID') {
          Alert.alert('Pago confirmado', `Tu reserva quedó confirmada.\nCódigo: ${finalized.confirmationCode}`)
          return
        }
        Alert.alert('Pago recibido', `Estamos confirmando tu depósito.\nCódigo: ${checkout.confirmationCode}`)
        return
      }

      if (paymentStatus === 'cancelled') {
        Alert.alert('Pago pendiente', 'No se abrió Stripe. Puedes reintentarlo desde esta pantalla.')
        return
      }

      Alert.alert('Pago pendiente', 'Si completaste el pago, lo verás reflejado aquí en unos segundos.')
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Intenta de nuevo.'
      Alert.alert('No pudimos iniciar el pago', message)
    },
  })

  const reservation = reservationQuery.data
  const status = statusCopy(reservation?.status, reservation?.depositStatus, reservation?.depositAmount)
  const depositAmount = formatMoney(reservation?.depositAmount)
  const canCancel = reservation?.cancellation?.allowed && reservation.status !== 'CANCELLED'
  const payableDepositStatuses = [null, undefined, 'PENDING', 'EXPIRED', 'CARD_HOLD']
  const canPayDeposit = Boolean(
    token &&
      resolvedVenueSlug &&
      cancelSecret &&
      reservation?.depositAmount &&
      payableDepositStatuses.includes(reservation.depositStatus) &&
      reservation.status !== 'CANCELLED',
  )

  const vertical = detectVertical({
    type: null,
    name: reservation?.venue?.name,
    productType: reservation?.product?.type ?? null,
  })

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Reserva" onBack={goBackOrHome} />

      {reservationQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {reservationQuery.isError ? (
        <View style={styles.centered}>
          <BodyText color={colors.danger}>No pudimos cargar esta reserva.</BodyText>
          <Button label="Volver" onPress={goBackOrHome} />
        </View>
      ) : null}

      {reservation ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxxl }]}
          refreshControl={<RefreshControl refreshing={reservationQuery.isRefetching} onRefresh={() => reservationQuery.refetch()} tintColor={colors.primary} />}
        >
          <View style={styles.heroBlock}>
            <Avatar fallback={reservation.venue?.name ?? '·'} vertical={vertical} size={56} />
            <View style={styles.heroText}>
              <Kicker color={colors.muted}>{reservation.venue?.name ?? 'Reserva'}</Kicker>
              <Heading level="display" style={styles.heroTitle}>
                {reservation.product?.name ?? 'Reserva'}
              </Heading>
            </View>
          </View>

          <Pill label={status.label} tone={status.tone} />

          <View style={styles.timePanel}>
            <PanelLabel>Cuándo</PanelLabel>
            <Text style={styles.dateLine}>{formatDate(reservation.startsAt, reservation.venue?.timezone)}</Text>
            <Text style={styles.timeLine}>{formatTimeRange(reservation.startsAt, reservation.endsAt, reservation.venue?.timezone)}</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.gridBox, styles.gridBoxLeft]}>
              <PanelLabel>Personas</PanelLabel>
              <Text style={styles.gridValue}>{reservation.partySize}</Text>
            </View>
            <View style={[styles.gridBox, styles.gridBoxRight]}>
              <PanelLabel>Duración</PanelLabel>
              <Text style={styles.gridValue}>{reservation.duration} <Text style={styles.gridUnit}>min</Text></Text>
            </View>
          </View>

          <View style={styles.codePanel}>
            <PanelLabel>Código de confirmación</PanelLabel>
            <Text style={styles.codeValue}>{reservation.confirmationCode}</Text>
          </View>

          {depositAmount ? (
            <View style={styles.panel}>
              <PanelLabel>Depósito</PanelLabel>
              <Text style={styles.panelValue}>{depositAmount}</Text>
              <BodyText variant="bodySmall" color={colors.muted} style={styles.panelHelper}>
                {reservation.depositStatus === 'PAID'
                  ? 'Pago aplicado correctamente.'
                  : 'El pago está pendiente o todavía se está confirmando.'}
              </BodyText>
            </View>
          ) : null}

          {reservation.specialRequests ? (
            <View style={styles.panel}>
              <PanelLabel>Notas</PanelLabel>
              <BodyText variant="body" color={colors.text} style={styles.panelHelper}>
                {reservation.specialRequests}
              </BodyText>
            </View>
          ) : null}

          <View style={styles.actions}>
            {canPayDeposit ? (
              <Button
                label={payMutation.isPending ? 'Abriendo pago…' : 'Pagar depósito'}
                loading={payMutation.isPending}
                onPress={() => payMutation.mutate()}
              />
            ) : null}
            {resolvedVenueSlug ? (
              <Button label="Ver el lugar" variant="secondary" onPress={() => router.push(`/venues/${resolvedVenueSlug}`)} />
            ) : null}
            {canCancel ? (
              <Button
                label={cancelMutation.isPending ? 'Cancelando…' : 'Cancelar reserva'}
                variant="ghost"
                loading={cancelMutation.isPending}
                onPress={() => {
                  Alert.alert('Cancelar reserva', '¿Seguro que quieres cancelar esta reserva?', [
                    { text: 'No', style: 'cancel' },
                    { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate() },
                  ])
                }}
              />
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.md,
  },
  heroBlock: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    marginBottom: space.xs,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
  },
  panel: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xxs,
  },
  panelLabel: {
    ...type.kicker,
    color: colors.muted,
  },
  panelValue: {
    ...type.subtitle,
    color: colors.text,
    marginTop: 4,
  },
  panelHelper: {
    marginTop: 6,
  },
  timePanel: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  dateLine: {
    ...type.label,
    color: colors.muted,
    fontFamily: fontFamilies.textMedium,
    textTransform: 'capitalize',
    marginTop: 6,
  },
  timeLine: {
    ...type.display,
    color: colors.text,
    fontSize: 32,
    lineHeight: 36,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  gridBox: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: 4,
  },
  gridBoxLeft: {},
  gridBoxRight: {},
  gridValue: {
    ...type.title,
    color: colors.text,
    marginTop: 4,
  },
  gridUnit: {
    ...type.body,
    color: colors.muted,
    fontFamily: fontFamilies.textMedium,
    fontSize: 14,
  },
  codePanel: {
    borderRadius: 22,
    backgroundColor: colors.inkTint,
    padding: space.md,
    gap: 4,
  },
  codeValue: {
    ...type.display,
    color: colors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 28,
    lineHeight: 32,
    marginTop: 4,
    letterSpacing: 1.6,
  },
  actions: {
    gap: space.sm,
    marginTop: space.lg,
  },
})
