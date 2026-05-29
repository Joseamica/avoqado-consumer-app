import * as AppleAuthentication from 'expo-apple-authentication'
import { useState } from 'react'
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BodyText } from '../src/components/BodyText'
import { Heading, Kicker } from '../src/components/Heading'
import { getGoogleIdToken, getGoogleSignInConfigError, isGoogleSignInAvailable } from '../src/auth/google'
import { useAuthStore } from '../src/store/authStore'
import { colors } from '../src/theme/colors'
import { space } from '../src/theme/spacing'
import { fontFamilies, type } from '../src/theme/typography'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [isLoading, setIsLoading] = useState(false)
  const signInWithProviderToken = useAuthStore(state => state.signInWithProviderToken)
  const googleConfigError = getGoogleSignInConfigError()
  const googleEnabled = isGoogleSignInAvailable()

  async function signInWithGoogle() {
    if (googleConfigError) {
      Alert.alert('Google Sign-In no configurado', googleConfigError)
      return
    }
    try {
      setIsLoading(true)
      const idToken = await getGoogleIdToken()
      await signInWithProviderToken({ provider: 'GOOGLE', idToken })
    } catch (error) {
      Alert.alert('No pudimos iniciar con Google', error instanceof Error ? error.message : 'Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  async function signInWithApple() {
    try {
      setIsLoading(true)
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      })
      if (!credential.identityToken) throw new Error('Apple no regresó un identityToken')
      await signInWithProviderToken({
        provider: 'APPLE',
        idToken: credential.identityToken,
        firstName: credential.fullName?.givenName ?? undefined,
        lastName: credential.fullName?.familyName ?? undefined,
      })
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('No pudimos iniciar con Apple', error instanceof Error ? error.message : 'Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.heroBlock}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.crest}
          accessible
          accessibilityLabel="Avoqado"
        />
        <Kicker color={colors.accentDeep} style={styles.brand}>
          Avoqado
        </Kicker>
      </View>

      <View style={styles.copyBlock}>
        <Heading level="hero" style={styles.title}>
          Reserva tu lugar{'\n'}en lo que disfrutas.
        </Heading>
        <BodyText variant="bodyLarge" color={colors.textSubtle} style={styles.subtitle}>
          Encuentra estudios de yoga, salones, clínicas y más — todos curados, listos para reservar en segundos.
        </BodyText>
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, space.lg) + space.md }]}>
        {Platform.OS === 'ios' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continuar con Apple"
            disabled={isLoading}
            onPress={signInWithApple}
            style={({ pressed }) => [styles.appleButton, pressed && !isLoading ? styles.pressed : null, isLoading ? styles.disabled : null]}
          >
            <Text style={styles.appleGlyph}></Text>
            <Text style={styles.appleLabel}>Continuar con Apple</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar con Google"
          disabled={isLoading || !googleEnabled}
          onPress={signInWithGoogle}
          style={({ pressed }) => [styles.googleButton, pressed && !isLoading ? styles.pressed : null, isLoading || !googleEnabled ? styles.disabled : null]}
        >
          <Text style={styles.googleGlyph}>G</Text>
          <Text style={styles.googleLabel}>Continuar con Google</Text>
        </Pressable>

        {!googleEnabled ? (
          <BodyText variant="bodySmall" color={colors.muted} align="center" style={styles.warn}>
            Google Sign-In requiere client IDs para esta build.
          </BodyText>
        ) : null}

        <BodyText variant="caption" color={colors.mutedSoft} align="center" style={styles.legal}>
          Al continuar aceptas los términos y la política de privacidad.
        </BodyText>
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
  heroBlock: {
    paddingTop: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  crest: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 2,
  },
  copyBlock: {
    paddingTop: space.huge,
    gap: space.md,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    maxWidth: 360,
  },
  actions: {
    gap: space.sm,
  },
  appleButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  appleGlyph: {
    color: colors.surface,
    fontSize: 20,
    lineHeight: 22,
  },
  appleLabel: {
    ...type.button,
    fontFamily: fontFamilies.textSemibold,
    color: colors.surface,
  },
  googleButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleGlyph: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  googleLabel: {
    ...type.button,
    fontFamily: fontFamilies.textSemibold,
    color: colors.text,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.4,
  },
  warn: {
    marginTop: 4,
  },
  legal: {
    marginTop: space.sm,
  },
})
