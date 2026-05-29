import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BodyText } from '../src/components/BodyText'
import { Button } from '../src/components/Button'
import { Heading, Kicker } from '../src/components/Heading'
import { colors } from '../src/theme/colors'
import { space } from '../src/theme/spacing'
import { fontFamilies, type } from '../src/theme/typography'

type PaymentState = 'success' | 'cancelled' | 'pending'

const COPY: Record<PaymentState, { kicker: string; title: string; body: string; tone: 'success' | 'warning' | 'neutral' }> = {
  success: {
    kicker: 'Pago recibido',
    title: 'Estamos confirmando tu reserva.',
    body: 'En cuanto Stripe confirme el pago verás el estado actualizado en Mis reservas. Suele tardar unos segundos.',
    tone: 'success',
  },
  cancelled: {
    kicker: 'Pago cancelado',
    title: 'Tu lugar sigue en espera.',
    body: 'Puedes reintentarlo desde el detalle de la reserva antes de que expire la ventana de depósito.',
    tone: 'warning',
  },
  pending: {
    kicker: 'Pago pendiente',
    title: 'Lo estamos confirmando.',
    body: 'Si completaste el pago, lo verás reflejado en Mis reservas en breve.',
    tone: 'neutral',
  },
}

export default function PaymentResultScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { payment, reservationId, venueSlug } = useLocalSearchParams<{ payment?: string; reservationId?: string; venueSlug?: string }>()
  const state: PaymentState = payment === 'success' ? 'success' : payment === 'cancelled' ? 'cancelled' : 'pending'
  const copy = COPY[state]

  const accentInk = state === 'success' ? colors.success : state === 'cancelled' ? colors.warning : colors.muted
  const accentBg = state === 'success' ? colors.successTint : state === 'cancelled' ? colors.warningTint : colors.surfaceMuted

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.content}>
        <View style={[styles.medal, { backgroundColor: accentBg }]}>
          <Text style={[styles.medalGlyph, { color: accentInk }]}>{state === 'success' ? '✓' : state === 'cancelled' ? '×' : '·'}</Text>
        </View>
        <Kicker color={accentInk}>{copy.kicker}</Kicker>
        <Heading level="display" style={styles.title}>
          {copy.title}
        </Heading>
        <BodyText variant="bodyLarge" color={colors.textSubtle} style={styles.body}>
          {copy.body}
        </BodyText>
        {reservationId ? (
          <View style={styles.referenceBlock}>
            <Text style={styles.referenceLabel}>Referencia</Text>
            <Text style={styles.referenceValue}>{reservationId}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label="Ver mis reservas" onPress={() => router.replace('/reservations')} />
        {venueSlug ? (
          <Button label="Volver al lugar" variant="secondary" onPress={() => router.replace(`/venues/${venueSlug}`)} />
        ) : null}
        <Button label="Buscar más lugares" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.xl,
    justifyContent: 'space-between',
  },
  content: {
    paddingTop: space.huge,
    gap: space.sm,
  },
  medal: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  medalGlyph: {
    ...type.display,
    fontFamily: fontFamilies.displayBold,
  },
  title: {
    color: colors.text,
    marginTop: 4,
    maxWidth: 360,
  },
  body: {
    marginTop: space.xxs,
    maxWidth: 360,
  },
  referenceBlock: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  referenceLabel: {
    ...type.kicker,
    color: colors.muted,
  },
  referenceValue: {
    ...type.label,
    color: colors.text,
    marginTop: 4,
    fontFamily: fontFamilies.textSemibold,
  },
  actions: {
    gap: space.sm,
  },
})
