import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar } from '../../src/components/Avatar'
import { BodyText } from '../../src/components/BodyText'
import { Button } from '../../src/components/Button'
import { Heading, Kicker } from '../../src/components/Heading'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { useAuthStore } from '../../src/store/authStore'
import { colors } from '../../src/theme/colors'
import { space } from '../../src/theme/spacing'
import { fontFamilies, type } from '../../src/theme/typography'

function fieldOrPlaceholder(value?: string | null) {
  return value?.trim() ? value : 'Sin agregar'
}

function FieldRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabelWrap}>
        <BodyText variant="caption" color={colors.muted} style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {label}
        </BodyText>
      </View>
      <BodyText
        variant="body"
        color={muted ? colors.muted : colors.text}
        style={{ fontFamily: fontFamilies.textSemibold, fontSize: 16 }}
      >
        {value}
      </BodyText>
    </View>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const consumer = useAuthStore(state => state.consumer)
  const signOut = useAuthStore(state => state.signOut)
  const fullName = [consumer?.firstName, consumer?.lastName].filter(Boolean).join(' ').trim()
  const initial = (consumer?.firstName ?? consumer?.email ?? '·').slice(0, 1).toUpperCase()

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Perfil" />

      <View style={[styles.content, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.hero}>
          <Avatar
            uri={consumer?.avatarUrl ?? undefined}
            fallback={initial}
            size={88}
            vertical="wellness"
            shape="circle"
          />
          <View style={styles.heroText}>
            <Kicker color={colors.muted}>Cuenta</Kicker>
            <Heading level="display" style={styles.heroTitle}>
              {fullName || 'Tu perfil.'}
            </Heading>
          </View>
        </View>

        <View style={styles.fieldsCard}>
          <FieldRow label="Nombre" value={fieldOrPlaceholder(fullName)} muted={!fullName} />
          <View style={styles.fieldDivider} />
          <FieldRow
            label="Correo"
            value={fieldOrPlaceholder(consumer?.email)}
            muted={!consumer?.email}
          />
          <View style={styles.fieldDivider} />
          <FieldRow
            label="Teléfono"
            value={fieldOrPlaceholder(consumer?.phone)}
            muted={!consumer?.phone}
          />
        </View>

        <View style={styles.actions}>
          <Button label="Mis reservas" variant="secondary" onPress={() => router.push('/reservations')} />
          <Button label="Mis créditos" variant="secondary" onPress={() => router.push('/credits')} />
          <Button label="Cerrar sesión" variant="ghost" onPress={signOut} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.xl,
  },
  hero: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    gap: space.xxs,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 36,
  },
  fieldsCard: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
  },
  fieldRow: {
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  fieldLabelWrap: {
    minWidth: 96,
  },
  fieldDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  actions: {
    gap: space.sm,
    marginTop: 'auto',
  },
})
