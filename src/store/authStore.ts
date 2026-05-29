import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import type { Consumer } from '../api/types'
import { getMe, oauthLogin } from '../api/client'

const TOKEN_KEY = 'avoqado.consumer.token'

type AuthState = {
  token: string | null
  consumer: Consumer | null
  isBootstrapping: boolean
  signInWithProviderToken: (input: { provider: 'GOOGLE' | 'APPLE'; idToken: string; firstName?: string; lastName?: string }) => Promise<void>
  bootstrap: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  consumer: null,
  isBootstrapping: true,

  async signInWithProviderToken(input) {
    const result = await oauthLogin(input)
    await SecureStore.setItemAsync(TOKEN_KEY, result.token)
    set({ token: result.token, consumer: result.consumer })
  },

  async bootstrap() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    if (!token) {
      set({ token: null, consumer: null, isBootstrapping: false })
      return
    }

    try {
      const result = await getMe(token)
      set({ token, consumer: result.consumer, isBootstrapping: false })
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
      set({ token: null, consumer: null, isBootstrapping: false })
    }
  },

  async signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    set({ token: null, consumer: null })
  },
}))
