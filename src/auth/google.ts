import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { Platform } from 'react-native'

let configured = false

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim()
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()

export function getGoogleSignInConfigError() {
  if (!googleWebClientId) {
    return 'Falta configurar EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
  }

  if (Platform.OS === 'ios' && !googleIosClientId) {
    return 'Falta configurar EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
  }

  return null
}

export function isGoogleSignInAvailable() {
  return getGoogleSignInConfigError() == null
}

export function configureGoogleSignIn() {
  if (configured) return

  const configError = getGoogleSignInConfigError()
  if (configError) {
    throw new Error(configError)
  }

  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
  })
  configured = true
}

export async function getGoogleIdToken() {
  configureGoogleSignIn()
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  const result = await GoogleSignin.signIn()
  const tokens = await GoogleSignin.getTokens()
  const idToken = tokens.idToken ?? result.data?.idToken

  if (!idToken) {
    throw new Error('Google no regreso un idToken')
  }

  return idToken
}
