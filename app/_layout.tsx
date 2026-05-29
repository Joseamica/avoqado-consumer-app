import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  useFonts as useFraunces,
} from '@expo-google-fonts/fraunces'
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, useFonts as useGeist } from '@expo-google-fonts/geist'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../src/store/authStore'
import { colors } from '../src/theme/colors'

function AuthGate() {
  const router = useRouter()
  const segments = useSegments()
  const { token, isBootstrapping, bootstrap } = useAuthStore()

  const [fraunces] = useFraunces({
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
  })
  const [geist] = useGeist({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  })
  const fontsReady = fraunces && geist

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (isBootstrapping || !fontsReady) return
    const inAuthGroup = segments[0] === 'login'

    if (!token && !inAuthGroup) {
      router.replace('/login')
    }
    if (token && inAuthGroup) {
      router.replace('/')
    }
  }, [isBootstrapping, fontsReady, router, segments, token])

  if (isBootstrapping || !fontsReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </>
  )
}

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), [])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
