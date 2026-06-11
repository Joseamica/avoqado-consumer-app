import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  createCreditPackCheckout,
  createReservation,
  finalizeCreditPackCheckout,
  finalizeReservationDepositCheckout,
  getAvailability,
  getClassAvailability,
  getCreditBalance,
  getCreditPacks,
  getVenue,
} from '../../../src/api/client'
import type { CreditBalanceItem, CreditPack, Product } from '../../../src/api/types'
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
import { accentFor, detectVertical } from '../../../src/theme/verticals'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function toApiDate(date: Date, timeZone?: string) {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
    const part = (t: string) => parts.find(p => p.type === t)?.value ?? ''
    return `${part('year')}-${part('month')}-${part('day')}`
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateLabel(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat('es-MX', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatSlot(startsAt: string, endsAt: string, timeZone?: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone })}`
}

function parsePackPrice(price: number | string) {
  const amount = typeof price === 'number' ? price : Number(price)
  return Number.isFinite(amount) ? amount : 0
}

function addDays(base: Date, days: number) {
  const next = new Date(base)
  next.setDate(base.getDate() + days)
  return next
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

function productTypeLabel(product?: Product | null) {
  if (!product) return 'Servicio'
  if (product.type === 'CLASS') return 'Clase'
  if (product.type === 'EVENT') return 'Evento'
  return 'Cita'
}

export default function VenueDetailScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const scrollRef = useRef<ScrollView>(null)
  const requiredPhoneInputRef = useRef<TextInput>(null)
  const token = useAuthStore(state => state.token)
  const consumer = useAuthStore(state => state.consumer)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [phone, setPhone] = useState('')
  const [requiredPhoneDraft, setRequiredPhoneDraft] = useState('')
  const [phoneModalVisible, setPhoneModalVisible] = useState(false)
  const [partySize, setPartySize] = useState('1')
  const [notes, setNotes] = useState('')
  const [selectedClassSessionId, setSelectedClassSessionId] = useState<string | null>(null)
  const [selectedAppointmentSlotKey, setSelectedAppointmentSlotKey] = useState<string | null>(null)
  const [selectedCreditBalanceId, setSelectedCreditBalanceId] = useState<string | null>(null)
  const [classDateOffset, setClassDateOffset] = useState(1)
  const [appointmentDateOffset, setAppointmentDateOffset] = useState(1)
  const [creditModalVisible, setCreditModalVisible] = useState(false)

  const goBackOrHome = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const venueQuery = useQuery({
    queryKey: ['venue', slug],
    queryFn: () => getVenue(token!, slug),
    enabled: Boolean(token && slug),
  })

  const product = selectedProduct ?? venueQuery.data?.products[0] ?? null
  const isClass = product?.type === 'CLASS'
  const requiresPhone = venueQuery.data?.publicBooking.requirePhone ?? false
  const requiresEmail = venueQuery.data?.publicBooking.requireEmail ?? false
  // Defaults to true so older payloads (no flag) keep working.
  const bookingEnabled = venueQuery.data?.publicBooking.enabled ?? true
  // How far ahead the venue allows booking. Drives the date rail cap so the
  // customer can reach every bookable day (was hardcoded to 14).
  const maxAdvanceDays = venueQuery.data?.scheduling?.maxAdvanceDays ?? 14
  const venueTimezone = venueQuery.data?.timezone
  const seats = Math.max(1, Number(partySize) || 1)
  const contactPhone = phone.trim() || consumer?.phone || ''
  const contactEmail = (consumer?.email ?? '').trim()

  const vertical = useMemo(
    () => detectVertical({ type: venueQuery.data?.type, name: venueQuery.data?.name, productType: product?.type ?? null }),
    [venueQuery.data?.type, venueQuery.data?.name, product?.type],
  )
  const accent = accentFor(vertical)

  const classDateObj = useMemo(() => addDays(new Date(), classDateOffset), [classDateOffset])
  const classDate = useMemo(() => toApiDate(classDateObj, venueTimezone), [classDateObj, venueTimezone])
  const appointmentDateObj = useMemo(() => addDays(new Date(), appointmentDateOffset), [appointmentDateOffset])
  const appointmentDate = useMemo(() => toApiDate(appointmentDateObj, venueTimezone), [appointmentDateObj, venueTimezone])
  const appointmentDuration = product?.duration ?? 60

  useEffect(() => {
    setSelectedClassSessionId(null)
    setSelectedAppointmentSlotKey(null)
    setSelectedCreditBalanceId(null)
  }, [product?.id])

  const classAvailabilityQuery = useQuery({
    queryKey: ['class-availability', slug, classDate, product?.id],
    queryFn: () => getClassAvailability(slug, { date: classDate, productId: product!.id }),
    enabled: Boolean(slug && isClass && product?.id),
  })

  const appointmentAvailabilityQuery = useQuery({
    queryKey: ['appointment-availability', slug, appointmentDate, product?.id, appointmentDuration, seats],
    queryFn: () =>
      getAvailability(slug, { date: appointmentDate, duration: appointmentDuration, partySize: seats, productId: product?.id }),
    enabled: Boolean(slug && !isClass && product?.id),
  })

  const creditPacksQuery = useQuery({
    queryKey: ['credit-packs', slug, product?.id],
    queryFn: () => getCreditPacks(slug, product?.id),
    enabled: Boolean(slug && isClass && product?.id),
  })

  const creditBalancesQuery = useQuery({
    queryKey: ['credit-balances', slug, product?.id, seats, consumer?.email, contactPhone],
    queryFn: () =>
      getCreditBalance(slug, {
        email: consumer?.email ?? undefined,
        phone: contactPhone || undefined,
        seats,
        productId: product?.id,
      }),
    enabled: Boolean(slug && isClass && product?.requireCreditForBooking && (consumer?.email || contactPhone)),
  })

  const eligibleBalances = useMemo(() => {
    const purchases = creditBalancesQuery.data?.purchases ?? []
    const rows: Array<CreditBalanceItem & { purchaseId: string; packName: string }> = []
    for (const purchase of purchases) {
      for (const balance of purchase.itemBalances) {
        rows.push({ ...balance, purchaseId: purchase.id, packName: purchase.creditPack.name })
      }
    }
    return rows
  }, [creditBalancesQuery.data?.purchases])

  const selectedSlot = useMemo(
    () => (classAvailabilityQuery.data?.slots ?? []).find(slot => slot.classSessionId === selectedClassSessionId) ?? null,
    [classAvailabilityQuery.data?.slots, selectedClassSessionId],
  )
  const selectedAppointmentSlot = useMemo(
    () => (appointmentAvailabilityQuery.data?.slots ?? []).find(slot => `${slot.startsAt}-${slot.endsAt}` === selectedAppointmentSlotKey) ?? null,
    [appointmentAvailabilityQuery.data?.slots, selectedAppointmentSlotKey],
  )
  const selectedCredit = useMemo(
    () => eligibleBalances.find(balance => balance.id === selectedCreditBalanceId) ?? null,
    [eligibleBalances, selectedCreditBalanceId],
  )

  const classDateOptions = useMemo(() => {
    const startOffset = Math.min(Math.max(0, classDateOffset - 3), 8)
    return Array.from({ length: 7 }, (_, index) => {
      const offset = startOffset + index
      const date = addDays(new Date(), offset)
      const label = offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : new Intl.DateTimeFormat('es-MX', { weekday: 'short', timeZone: venueTimezone }).format(date)
      const day = new Intl.DateTimeFormat('es-MX', { day: 'numeric', timeZone: venueTimezone }).format(date)
      const month = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: venueTimezone }).format(date)
      return { offset, label, day, month }
    })
  }, [classDateOffset, venueTimezone])

  const appointmentDateOptions = useMemo(() => {
    const startOffset = Math.min(Math.max(0, appointmentDateOffset - 3), 8)
    return Array.from({ length: 7 }, (_, index) => {
      const offset = startOffset + index
      const date = addDays(new Date(), offset)
      const label = offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : new Intl.DateTimeFormat('es-MX', { weekday: 'short', timeZone: venueTimezone }).format(date)
      const day = new Intl.DateTimeFormat('es-MX', { day: 'numeric', timeZone: venueTimezone }).format(date)
      const month = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: venueTimezone }).format(date)
      return { offset, label, day, month }
    })
  }, [appointmentDateOffset, venueTimezone])

  useEffect(() => {
    setSelectedClassSessionId(null)
    setSelectedCreditBalanceId(null)
  }, [classDate])

  useEffect(() => {
    setSelectedAppointmentSlotKey(null)
  }, [appointmentDate])

  useEffect(() => {
    setSelectedAppointmentSlotKey(null)
    setSelectedCreditBalanceId(null)
  }, [seats])

  const updatePartySize = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setPartySize('')
      return
    }
    const remaining = selectedSlot?.remaining
    const maxSeats = remaining && remaining > 0 ? remaining : 20
    setPartySize(String(Math.min(Math.max(Number(digits), 1), maxSeats)))
  }

  const goToCredits = () => {
    setCreditModalVisible(true)
  }

  const buyPackMutation = useMutation({
    mutationFn: async (pack: CreditPack) => {
      const checkout = await createCreditPackCheckout(token!, slug, pack.id)
      const result = await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, 'avoqado://payment-result')

      if ((result.type === 'success' || result.type === 'dismiss') && token) {
        const sessionId = getSessionIdFromReturnUrl((result as any).url)
        if (sessionId) {
          await finalizeCreditPackCheckout(token, sessionId)
        }
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await queryClient.invalidateQueries({ queryKey: ['credit-balances'] })
          const latest = await queryClient.fetchQuery({
            queryKey: ['credit-balances', slug, product?.id, seats, consumer?.email, contactPhone],
            queryFn: () =>
              getCreditBalance(slug, {
                email: consumer?.email ?? undefined,
                phone: contactPhone || undefined,
                seats,
                productId: product?.id,
              }),
          })
          const firstBalance = (latest.purchases ?? []).flatMap(p => p.itemBalances).find(balance => balance.remainingQuantity > 0 && balance.sufficient)
          if (firstBalance) {
            setSelectedCreditBalanceId(firstBalance.id)
            setCreditModalVisible(false)
            Alert.alert('Crédito listo', 'Ya seleccionamos un crédito disponible para tu clase.')
            return
          }
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
      Alert.alert('Pago recibido', 'Si Stripe ya confirmó el pago, tus créditos pueden tardar unos segundos en reflejarse.')
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Intenta de nuevo.'
      if (message.toLowerCase().includes('telefono') || message.toLowerCase().includes('correo')) {
        Alert.alert('Completa tu contacto', 'Agrega teléfono o correo en tu perfil para comprar créditos.')
        return
      }
      Alert.alert('No pudimos iniciar el pago', message)
    },
  })

  const missingFields = () => {
    const missing: string[] = []
    if (!product) missing.push('servicio')
    if (!partySize || Number(partySize) < 1) missing.push('personas')
    if (isClass && !selectedSlot) missing.push('sesión')
    if (!isClass && !selectedAppointmentSlot) missing.push('horario')
    if (isClass && product?.requireCreditForBooking && !selectedCredit?.sufficient) missing.push('crédito suficiente')
    return missing
  }

  const canChooseCreditOrReserve = Boolean(product && partySize && Number(partySize) >= 1 && (isClass ? selectedSlot : selectedAppointmentSlot))
  const canSubmitReservation = canChooseCreditOrReserve && (!isClass || !product?.requireCreditForBooking || selectedCredit?.sufficient)
  const needsCredit = Boolean(isClass && product?.requireCreditForBooking && !selectedCredit?.sufficient)

  const reservationMutation = useMutation({
    mutationFn: (phoneOverride?: string) =>
      createReservation(token!, slug, {
        startsAt: isClass ? undefined : new Date(selectedAppointmentSlot!.startsAt),
        endsAt: isClass ? undefined : new Date(selectedAppointmentSlot!.endsAt),
        duration: isClass ? undefined : appointmentDuration,
        guestPhone: phoneOverride?.trim() || phone.trim() || undefined,
        partySize: seats,
        productId: product?.id,
        classSessionId: isClass ? selectedClassSessionId ?? undefined : undefined,
        creditItemBalanceId: isClass ? selectedCreditBalanceId ?? undefined : undefined,
        specialRequests: notes.trim() || undefined,
      }),
    onSuccess: async result => {
      const detailParams = {
        pathname: '/reservations/[cancelSecret]' as const,
        params: { cancelSecret: result.cancelSecret, venueSlug: slug, backTo: 'reservations' },
      }

      if (result.checkoutUrl) {
        const paymentResult = await WebBrowser.openAuthSessionAsync(result.checkoutUrl, 'avoqado://payment-result')
        const paymentStatus = getPaymentStatusFromReturnUrl((paymentResult as any).url)

        if (paymentStatus === 'success') {
          const sessionId = getSessionIdFromReturnUrl((paymentResult as any).url)
          let finalized: Awaited<ReturnType<typeof finalizeReservationDepositCheckout>> | null = null
          try {
            finalized = sessionId && token ? await finalizeReservationDepositCheckout(token, sessionId) : null
          } catch {
            finalized = null
          }
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['consumer-reservations'] }),
            queryClient.invalidateQueries({ queryKey: ['reservation-detail'] }),
          ])
          const finalizedDetailParams = {
            pathname: '/reservations/[cancelSecret]' as const,
            params: {
              cancelSecret: finalized?.cancelSecret ?? result.cancelSecret,
              venueSlug: finalized?.venueSlug ?? slug,
              backTo: 'reservations',
            },
          }
          if (finalized?.depositStatus === 'PAID') {
            Alert.alert('Pago confirmado', `Tu reserva quedó confirmada.\nCódigo: ${finalized.confirmationCode}`, [
              { text: 'Ver reserva', onPress: () => router.replace(finalizedDetailParams) },
            ])
            return
          }
          Alert.alert('Pago recibido', `Estamos confirmando tu depósito.\nCódigo: ${result.confirmationCode}`, [
            { text: 'Ver reserva', onPress: () => router.replace(finalizedDetailParams) },
          ])
          return
        }

        if (paymentStatus === 'cancelled') {
          Alert.alert('Reserva creada, pago pendiente', 'No se abrió Stripe. Puedes pagar el depósito desde el detalle.', [
            { text: 'Ver reserva', onPress: () => router.replace(detailParams) },
          ])
          return
        }

        Alert.alert('Reserva creada, pago pendiente', `Puedes pagar el depósito desde el detalle.\nCódigo: ${result.confirmationCode}`, [
          { text: 'Ver reserva', onPress: () => router.replace(detailParams) },
        ])
        return
      }

      Alert.alert('Reserva creada', `Código: ${result.confirmationCode}`, [{ text: 'Ver reserva', onPress: () => router.replace(detailParams) }])
    },
    onError: error => {
      const message = error instanceof Error ? error.message : 'Intenta de nuevo.'
      const userMessage = message.includes('validación') || message.includes('requeridos')
        ? 'Completa los datos requeridos.'
        : message.startsWith('HTTP')
        ? 'Hubo un problema con el servidor. Intenta de nuevo.'
        : message
      Alert.alert('No pudimos crear la reserva', userMessage)
    },
  })

  if (venueQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!venueQuery.data) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={goBackOrHome} title="Lugar" />
        <View style={styles.centeredInner}>
          <BodyText color={colors.danger}>No encontramos este lugar.</BodyText>
          <Button label="Volver" onPress={goBackOrHome} />
        </View>
      </View>
    )
  }

  const venue = venueQuery.data
  const availableSlots = (classAvailabilityQuery.data?.slots ?? []).filter(slot => slot.available && slot.classSessionId)
  const availableAppointmentSlots = (appointmentAvailabilityQuery.data?.slots ?? []).filter(slot => slot.available)
  const footerLabel = reservationMutation.isPending ? 'Reservando…' : needsCredit ? 'Elegir crédito' : 'Reservar'

  const isRefreshingVenue =
    venueQuery.isRefetching ||
    classAvailabilityQuery.isRefetching ||
    appointmentAvailabilityQuery.isRefetching ||
    creditPacksQuery.isRefetching ||
    creditBalancesQuery.isRefetching

  const refreshVenue = () => {
    const queries: Array<Promise<unknown>> = [venueQuery.refetch()]
    if (isClass) {
      queries.push(classAvailabilityQuery.refetch())
      queries.push(creditPacksQuery.refetch())
      if (product?.requireCreditForBooking) queries.push(creditBalancesQuery.refetch())
    } else {
      queries.push(appointmentAvailabilityQuery.refetch())
    }
    Promise.all(queries).catch(() => undefined)
  }

  const openPhoneModal = () => {
    Keyboard.dismiss()
    setRequiredPhoneDraft('')
    setPhoneModalVisible(true)
  }

  const submitReservationWithRequiredPhone = () => {
    const cleanPhone = requiredPhoneDraft.trim()
    if (!cleanPhone) return
    setPhone(cleanPhone)
    setPhoneModalVisible(false)
    reservationMutation.mutate(cleanPhone)
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={goBackOrHome} title={venue.name} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 160 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshingVenue} onRefresh={refreshVenue} tintColor={colors.primary} />}
      >
        {/* HERO — vertical-aware tinted block carrying the venue identity */}
        <View style={[styles.hero, { backgroundColor: accent.tint }]}>
          <View style={styles.heroTopRow}>
            <Avatar uri={venue.logo} fallback={venue.name} vertical={vertical} size={64} />
            <View style={[styles.verticalBadge, { backgroundColor: accent.surface }]}>
              <Text style={[styles.verticalBadgeText, { color: accent.deep }]}>{accent.label}</Text>
            </View>
          </View>
          <BodyText variant="bodyLarge" color={colors.textSubtle} style={styles.venueAddress} numberOfLines={2}>
            {[venue.address, venue.city].filter(Boolean).join(' · ') || 'Reservación disponible'}
          </BodyText>

          <View style={styles.heroChips}>
            <Pill tone="ink" label={productTypeLabel(product)} />
            {product?.duration ? <Pill tone="neutral" label={`${product.duration} min`} /> : null}
            {product?.requireCreditForBooking ? <Pill tone="success" label="Usa crédito" /> : null}
          </View>
        </View>

        {/* SERVICE PICKER */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionText}>
              <Kicker color={colors.muted}>Servicio</Kicker>
              <Heading level="title">{isClass ? 'Elige una clase' : 'Elige una cita'}</Heading>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>
            {venue.products.map(item => {
              const selected = product?.id === item.id
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedProduct(item)}
                  style={[
                    styles.productTile,
                    selected ? { backgroundColor: accent.ink, borderColor: accent.ink } : null,
                  ]}
                >
                  <Text style={[styles.productName, selected ? styles.onPrimaryText : null]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.productMeta, selected ? styles.onPrimaryMuted : null]}>
                    {productTypeLabel(item)} · {item.duration ?? 60} min
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* PARTY SIZE + NOTES */}
        <View style={styles.section}>
          <View style={styles.sectionText}>
            <Kicker color={colors.muted}>Detalles</Kicker>
            <Heading level="title">Tu reserva</Heading>
          </View>
          <View style={styles.formRow}>
            <View style={styles.partySizeBox}>
              <Text style={styles.inputLabel}>Personas</Text>
              <TextInput
                value={partySize}
                onChangeText={updatePartySize}
                placeholder="1"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                returnKeyType="done"
                inputAccessoryViewID={undefined}
                onSubmitEditing={Keyboard.dismiss}
                onEndEditing={Keyboard.dismiss}
                maxLength={2}
                style={styles.partySizeInput}
              />
            </View>
            <View style={styles.notesBox}>
              <Text style={styles.inputLabel}>Notas (opcional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Alergias, preferencias o instrucciones"
                placeholderTextColor={colors.muted}
                multiline
                returnKeyType="done"
                style={styles.notesInput}
              />
            </View>
          </View>
        </View>

        {/* CLASSES — sessions */}
        {isClass ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionText}>
                <Kicker color={colors.muted}>Horario</Kicker>
                <Heading level="title">Sesiones</Heading>
              </View>
              <Text style={[styles.dateBadge, { color: accent.deep }]}>{formatDateLabel(classDateObj, venueTimezone)}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRail}>
              {classDateOptions.map(option => {
                const selected = classDateOffset === option.offset
                return (
                  <Pressable
                    key={option.offset}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setClassDateOffset(option.offset)}
                    style={[styles.dateChip, selected ? { backgroundColor: accent.ink, borderColor: accent.ink } : null]}
                  >
                    <Text style={[styles.dateChipLabel, selected ? styles.onPrimaryText : null]}>{option.label}</Text>
                    <Text style={[styles.dateChipNumber, selected ? styles.onPrimaryText : null]}>{option.day}</Text>
                    <Text style={[styles.dateChipMonth, selected ? styles.onPrimaryMuted : null]}>{option.month}</Text>
                  </Pressable>
                )
              })}
              <Pressable accessibilityRole="button" accessibilityLabel="Ver más días" onPress={() => setClassDateOffset(v => Math.min(maxAdvanceDays, v + 1))} style={styles.dateChipMore}>
                <Text style={styles.dateChipMoreLabel}>Más</Text>
                <Text style={styles.dateChipMoreSub}>días</Text>
              </Pressable>
            </ScrollView>

            {classAvailabilityQuery.isLoading ? <ActivityIndicator color={accent.deep} style={styles.loader} /> : null}
            {classAvailabilityQuery.isError ? (
              <BodyText color={colors.danger}>{queryErrorMessage(classAvailabilityQuery.error, 'No pudimos cargar horarios.')}</BodyText>
            ) : null}
            {!classAvailabilityQuery.isLoading && availableSlots.length === 0 ? (
              <EmptyState
                kicker="Sin disponibilidad"
                title="No hay sesiones este día"
                description="Prueba con el día siguiente para ver más espacios."
                variant="card"
              />
            ) : null}

            <View style={styles.slotStack}>
              {availableSlots.map(slot => {
                const selected = selectedClassSessionId === slot.classSessionId
                return (
                  <Pressable
                    key={slot.classSessionId}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedClassSessionId(slot.classSessionId!)}
                    style={[styles.slotCard, selected ? { borderColor: accent.ink, backgroundColor: accent.tint } : null]}
                  >
                    <View>
                      <Text style={[styles.slotTime, selected ? { color: accent.deep } : null]}>{formatSlot(slot.startsAt, slot.endsAt, venueTimezone)}</Text>
                      <Text style={styles.slotMeta}>{slot.remaining ?? 0} {(slot.remaining ?? 0) === 1 ? 'lugar' : 'lugares'}</Text>
                    </View>
                    <View style={[styles.radio, selected ? { borderColor: accent.deep, backgroundColor: accent.ink } : null]}>
                      {selected ? <Text style={styles.radioCheck}>✓</Text> : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>

            {product?.requireCreditForBooking && !selectedCredit?.sufficient ? (
              <Pressable accessibilityRole="button" onPress={goToCredits} style={[styles.notice, { backgroundColor: accent.tint }]}>
                <View style={styles.noticeText}>
                  <Text style={[styles.noticeTitle, { color: accent.deep }]}>Esta clase usa créditos</Text>
                  <BodyText variant="bodySmall" color={colors.textSubtle}>
                    Selecciona o compra un paquete para terminar la reserva.
                  </BodyText>
                </View>
                <Text style={[styles.noticeArrow, { color: accent.deep }]}>→</Text>
              </Pressable>
            ) : null}

            {product?.requireCreditForBooking && selectedCredit ? (
              <Pressable accessibilityRole="button" onPress={goToCredits} style={[styles.notice, { backgroundColor: colors.successTint }]}>
                <View style={styles.noticeText}>
                  <Text style={[styles.noticeTitle, { color: colors.success }]}>Crédito seleccionado</Text>
                  <BodyText variant="bodySmall" color={colors.textSubtle}>
                    {selectedCredit.packName} · quedan {selectedCredit.remainingQuantity}
                  </BodyText>
                </View>
                <Text style={[styles.noticeArrow, { color: colors.success }]}>→</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* APPOINTMENTS — slots */}
        {!isClass ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionText}>
                <Kicker color={colors.muted}>Horario</Kicker>
                <Heading level="title">Disponibles</Heading>
              </View>
              <Text style={[styles.dateBadge, { color: accent.deep }]}>{formatDateLabel(appointmentDateObj, venueTimezone)}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRail}>
              {appointmentDateOptions.map(option => {
                const selected = appointmentDateOffset === option.offset
                return (
                  <Pressable
                    key={option.offset}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setAppointmentDateOffset(option.offset)}
                    style={[styles.dateChip, selected ? { backgroundColor: accent.ink, borderColor: accent.ink } : null]}
                  >
                    <Text style={[styles.dateChipLabel, selected ? styles.onPrimaryText : null]}>{option.label}</Text>
                    <Text style={[styles.dateChipNumber, selected ? styles.onPrimaryText : null]}>{option.day}</Text>
                    <Text style={[styles.dateChipMonth, selected ? styles.onPrimaryMuted : null]}>{option.month}</Text>
                  </Pressable>
                )
              })}
              <Pressable accessibilityRole="button" accessibilityLabel="Ver más días" onPress={() => setAppointmentDateOffset(v => Math.min(maxAdvanceDays, v + 1))} style={styles.dateChipMore}>
                <Text style={styles.dateChipMoreLabel}>Más</Text>
                <Text style={styles.dateChipMoreSub}>días</Text>
              </Pressable>
            </ScrollView>

            {appointmentAvailabilityQuery.isLoading ? <ActivityIndicator color={accent.deep} style={styles.loader} /> : null}
            {appointmentAvailabilityQuery.isError ? (
              <BodyText color={colors.danger}>{queryErrorMessage(appointmentAvailabilityQuery.error, 'No pudimos cargar horarios.')}</BodyText>
            ) : null}
            {!appointmentAvailabilityQuery.isLoading && availableAppointmentSlots.length === 0 ? (
              <EmptyState
                kicker="Sin disponibilidad"
                title="Sin horarios este día"
                description="Prueba otro día o cambia el número de personas."
                variant="card"
              />
            ) : null}

            <View style={styles.slotStack}>
              {availableAppointmentSlots.map(slot => {
                const slotKey = `${slot.startsAt}-${slot.endsAt}`
                const selected = selectedAppointmentSlotKey === slotKey
                return (
                  <Pressable
                    key={slotKey}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedAppointmentSlotKey(slotKey)}
                    style={[styles.slotCard, selected ? { borderColor: accent.ink, backgroundColor: accent.tint } : null]}
                  >
                    <View>
                      <Text style={[styles.slotTime, selected ? { color: accent.deep } : null]}>{formatSlot(slot.startsAt, slot.endsAt, venueTimezone)}</Text>
                      <Text style={styles.slotMeta}>Duración {appointmentDuration} min</Text>
                    </View>
                    <View style={[styles.radio, selected ? { borderColor: accent.deep, backgroundColor: accent.ink } : null]}>
                      {selected ? <Text style={styles.radioCheck}>✓</Text> : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* STICKY FOOTER */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.sm) + space.xs }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>{product?.name ?? 'Selecciona servicio'}</Text>
          <Text style={styles.footerMeta} numberOfLines={1}>
            {selectedSlot
              ? formatSlot(selectedSlot.startsAt, selectedSlot.endsAt, venueTimezone)
              : selectedAppointmentSlot
              ? formatSlot(selectedAppointmentSlot.startsAt, selectedAppointmentSlot.endsAt, venueTimezone)
              : selectedCredit
              ? `${selectedCredit.packName}`
              : `${seats} ${seats === 1 ? 'persona' : 'personas'}`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={footerLabel}
          accessibilityState={{ disabled: reservationMutation.isPending, busy: reservationMutation.isPending }}
          disabled={reservationMutation.isPending}
          onPress={() => {
            if (!canChooseCreditOrReserve) {
              const missing = missingFields()
              Alert.alert('Campos incompletos', missing.length > 0 ? `Completa: ${missing.join(', ')}` : 'Revisa los datos.')
              return
            }
            if (needsCredit) {
              goToCredits()
              return
            }
            if (!canSubmitReservation) {
              Alert.alert('Campos incompletos', `Completa: ${missingFields().join(', ')}`)
              return
            }
            if (!bookingEnabled) {
              Alert.alert('Reservas no disponibles', 'Este negocio no acepta reservas en línea por ahora. Contáctalo directamente.')
              return
            }
            if (requiresPhone && !contactPhone) {
              openPhoneModal()
              return
            }
            if (requiresEmail && !contactEmail) {
              Alert.alert('Correo requerido', 'Este negocio requiere un correo para reservar. Agrega un correo a tu cuenta e intenta de nuevo.')
              return
            }
            reservationMutation.mutate(undefined)
          }}
          style={({ pressed }) => [
            styles.footerCta,
            { backgroundColor: accent.ink },
            pressed && !reservationMutation.isPending ? styles.pressed : null,
            reservationMutation.isPending ? styles.disabled : null,
          ]}
        >
          <Text style={styles.footerCtaText}>{footerLabel}</Text>
        </Pressable>
      </View>

      {/* PHONE MODAL */}
      <Modal transparent visible={phoneModalVisible} animationType="fade" onRequestClose={() => setPhoneModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPhoneModalVisible(false)} />
          <View style={[styles.phoneModalCard, { paddingBottom: Math.max(insets.bottom + space.lg, space.xl) }]}>
            <Kicker color={colors.muted}>Contacto</Kicker>
            <Heading level="title" style={styles.modalTitle}>
              Agrega tu teléfono
            </Heading>
            <BodyText color={colors.muted} style={styles.modalSubtitle}>
              Este lugar lo necesita para confirmar la reserva.
            </BodyText>
            <TextInput
              ref={requiredPhoneInputRef}
              value={requiredPhoneDraft}
              onChangeText={setRequiredPhoneDraft}
              placeholder="55 1234 5678"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              onSubmitEditing={submitReservationWithRequiredPhone}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Button label="Cancelar" variant="ghost" onPress={() => setPhoneModalVisible(false)} />
              <Button
                label={reservationMutation.isPending ? 'Reservando…' : 'Continuar'}
                disabled={!requiredPhoneDraft.trim() || reservationMutation.isPending}
                loading={reservationMutation.isPending}
                onPress={submitReservationWithRequiredPhone}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={creditModalVisible} animationType="fade" onRequestClose={() => setCreditModalVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCreditModalVisible(false)} />
          <View style={[styles.creditModalCard, { paddingBottom: Math.max(insets.bottom + space.lg, space.xl) }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.sectionText}>
                <Kicker color={colors.muted}>Créditos</Kicker>
                <Heading level="title" style={styles.modalTitle}>
                  Elige cómo reservar
                </Heading>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setCreditModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {creditBalancesQuery.isLoading ? <ActivityIndicator color={accent.deep} style={styles.loader} /> : null}
            {creditBalancesQuery.isError ? (
              <BodyText color={colors.danger}>{queryErrorMessage(creditBalancesQuery.error, 'No pudimos cargar tus créditos.')}</BodyText>
            ) : null}

            {eligibleBalances.length > 0 ? (
              <View style={styles.modalSection}>
                <Kicker color={colors.muted}>Disponibles</Kicker>
                <View style={styles.slotStack}>
                  {eligibleBalances.map(balance => {
                    const selected = selectedCreditBalanceId === balance.id
                    const disabled = !balance.sufficient
                    return (
                      <Pressable
                        key={balance.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled }}
                        disabled={disabled}
                        onPress={() => {
                          setSelectedCreditBalanceId(balance.id)
                          setCreditModalVisible(false)
                        }}
                        style={[
                          styles.creditCard,
                          selected ? { borderColor: accent.ink, backgroundColor: accent.tint } : null,
                          disabled ? styles.disabled : null,
                        ]}
                      >
                        <View style={styles.creditTextBlock}>
                          <Text style={styles.creditPackName} numberOfLines={1}>
                            {balance.packName}
                          </Text>
                          <Text style={styles.creditMeta} numberOfLines={1}>
                            {balance.product.name} · {balance.remainingQuantity} disponibles
                          </Text>
                        </View>
                        <Text style={[styles.creditCount, { color: accent.deep }]}>{balance.remainingQuantity}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ) : !creditBalancesQuery.isLoading ? (
              <EmptyState
                kicker="Sin créditos"
                title="Compra un paquete"
                description="Después del pago seleccionaremos un crédito disponible para esta clase."
                variant="card"
              />
            ) : null}

            <View style={styles.modalSection}>
              <View style={styles.sectionHeader}>
                <Kicker color={colors.muted}>Comprar paquete</Kicker>
                {creditPacksQuery.isLoading ? <ActivityIndicator color={accent.deep} /> : null}
              </View>
              {creditPacksQuery.isError ? (
                <BodyText color={colors.danger}>{queryErrorMessage(creditPacksQuery.error, 'No pudimos cargar paquetes.')}</BodyText>
              ) : null}
              <View style={styles.slotStack}>
                {(creditPacksQuery.data ?? []).map(pack => (
                  <View key={pack.id} style={styles.packCard}>
                    <View style={styles.packTextBlock}>
                      <Text style={styles.packName}>{pack.name}</Text>
                      <Text style={styles.packPrice}>{formatMoney(parsePackPrice(pack.price))}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: buyPackMutation.isPending, busy: buyPackMutation.isPending }}
                      disabled={buyPackMutation.isPending}
                      onPress={() => buyPackMutation.mutate(pack)}
                      style={({ pressed }) => [
                        styles.buyButton,
                        { backgroundColor: accent.ink },
                        pressed && !buyPackMutation.isPending ? styles.pressed : null,
                        buyPackMutation.isPending ? styles.disabled : null,
                      ]}
                    >
                      <Text style={styles.buyButtonText}>{buyPackMutation.isPending ? 'Abriendo…' : 'Comprar'}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  headerWrap: {
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    gap: space.xl,
  },
  hero: {
    borderRadius: 28,
    padding: space.lg,
    gap: space.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verticalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  verticalBadgeText: {
    ...type.kicker,
    fontSize: 10,
  },
  venueAddress: {
    marginTop: space.xs,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: space.sm,
  },
  section: {
    gap: space.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: space.md,
  },
  subSectionHeader: {
    paddingTop: space.sm,
  },
  sectionText: {
    flex: 1,
    minWidth: 0,
  },
  dateBadge: {
    ...type.bodySmall,
    fontFamily: fontFamilies.textSemibold,
    textTransform: 'capitalize',
    paddingBottom: 4,
  },
  productRail: {
    gap: space.xs,
    paddingRight: space.xl,
  },
  productTile: {
    width: 188,
    minHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    justifyContent: 'space-between',
  },
  productName: {
    ...type.subtitle,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  productMeta: {
    ...type.bodySmall,
    color: colors.muted,
    marginTop: 6,
  },
  onPrimaryText: {
    color: colors.surface,
  },
  onPrimaryMuted: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
  formRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  partySizeBox: {
    width: 112,
    gap: 6,
  },
  notesBox: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    ...type.kicker,
    color: colors.muted,
  },
  partySizeInput: {
    height: 96,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.sm,
    color: colors.text,
    ...type.title,
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    textAlign: 'center',
  },
  notesInput: {
    height: 96,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.sm,
    color: colors.text,
    ...type.body,
    fontFamily: fontFamilies.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  dateRail: {
    gap: space.xs,
    paddingRight: space.xl,
  },
  dateChip: {
    minWidth: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
    gap: 2,
  },
  dateChipLabel: {
    ...type.caption,
    color: colors.muted,
    textTransform: 'capitalize',
    fontFamily: fontFamilies.textMedium,
  },
  dateChipNumber: {
    ...type.title,
    color: colors.text,
    fontSize: 22,
    lineHeight: 24,
  },
  dateChipMonth: {
    ...type.caption,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  dateChipMore: {
    minWidth: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'transparent',
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipMoreLabel: {
    ...type.label,
    color: colors.muted,
    fontFamily: fontFamilies.textSemibold,
  },
  dateChipMoreSub: {
    ...type.caption,
    color: colors.muted,
  },
  loader: {
    marginVertical: space.md,
  },
  slotStack: {
    gap: space.xs,
  },
  slotCard: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  slotTime: {
    ...type.subtitle,
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
  },
  slotMeta: {
    ...type.bodySmall,
    color: colors.muted,
    marginTop: 2,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheck: {
    color: colors.surface,
    fontSize: 14,
    lineHeight: 16,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    padding: space.md,
    borderRadius: 18,
  },
  noticeText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  noticeTitle: {
    ...type.label,
    fontFamily: fontFamilies.textSemibold,
  },
  noticeArrow: {
    fontFamily: fontFamilies.text,
    fontSize: 22,
    lineHeight: 24,
  },
  creditCard: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  creditTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  creditPackName: {
    ...type.subtitle,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  creditMeta: {
    ...type.bodySmall,
    color: colors.muted,
  },
  creditCount: {
    ...type.display,
    fontFamily: fontFamilies.displayBold,
    fontSize: 30,
    lineHeight: 32,
  },
  packCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  packTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  packName: {
    ...type.subtitle,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  packPrice: {
    ...type.label,
    color: colors.muted,
    fontFamily: fontFamilies.textSemibold,
  },
  buyButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    ...type.button,
    fontFamily: fontFamilies.textSemibold,
    color: colors.surface,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
    paddingHorizontal: space.xl,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOpacity: 1,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: -10 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  footerSummary: {
    flex: 1,
    minWidth: 0,
  },
  footerLabel: {
    ...type.label,
    color: colors.text,
    fontFamily: fontFamilies.textSemibold,
  },
  footerMeta: {
    ...type.bodySmall,
    color: colors.muted,
    marginTop: 2,
  },
  footerCta: {
    minHeight: 56,
    minWidth: 144,
    borderRadius: 20,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCtaText: {
    ...type.button,
    fontFamily: fontFamilies.textSemibold,
    color: colors.surface,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  phoneModalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.lg,
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  modalTitle: {
    color: colors.text,
    marginTop: 4,
  },
  modalSubtitle: {
    marginBottom: space.sm,
  },
  modalInput: {
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
    color: colors.text,
    ...type.title,
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: space.xs,
    paddingTop: space.xs,
  },
  creditModalCard: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.lg,
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 28,
    fontFamily: fontFamilies.textMedium,
    marginTop: -2,
  },
  modalSection: {
    gap: space.sm,
  },
})
