import type {
  AuthProvider,
  AuthResponse,
  CancelReservationResponse,
  ClassAvailabilityResponse,
  ConsumerCreditsResponse,
  ConsumerReservationsResponse,
  CreditBalanceResponse,
  CreditPack,
  CreditPackCheckoutResponse,
  FinalizeCreditCheckoutResponse,
  FinalizeReservationDepositCheckoutResponse,
  ReservationResponse,
  PublicReservationDetail,
  VenueDetail,
  ReservationDepositCheckoutResponse,
  VenueSearchResponse,
} from './types'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

type RequestOptions = {
  token?: string | null
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try {
      const payload = await response.json()
      message = payload.message ?? message
    } catch {
      // Keep fallback.
    }
    throw new Error(message)
  }

  return response.json()
}

export function oauthLogin(input: {
  provider: AuthProvider
  idToken: string
  firstName?: string
  lastName?: string
}) {
  return request<AuthResponse>('/consumer/auth/oauth', {
    method: 'POST',
    body: input,
  })
}

export function getMe(token: string) {
  return request<{ consumer: AuthResponse['consumer'] }>('/consumer/me', { token })
}

export function searchVenues(token: string, query: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  return request<VenueSearchResponse>(`/consumer/venues?${params.toString()}`, { token })
}

export function getVenue(token: string, venueSlug: string) {
  return request<VenueDetail>(`/consumer/venues/${venueSlug}`, { token })
}

export function createReservation(
  token: string,
  venueSlug: string,
  body: {
    startsAt?: Date
    endsAt?: Date
    duration?: number
    guestPhone?: string
    partySize?: number
    productId?: string
    classSessionId?: string
    creditItemBalanceId?: string
    specialRequests?: string
  },
) {
  return request<ReservationResponse>(`/consumer/venues/${venueSlug}/reservations`, {
    token,
    method: 'POST',
    body,
  })
}

export function getReservations(token: string) {
  return request<ConsumerReservationsResponse>('/consumer/reservations', { token })
}

export function getConsumerCredits(token: string) {
  return request<ConsumerCreditsResponse>('/consumer/credits', { token })
}

export function getReservationDetail(venueSlug: string, cancelSecret: string) {
  return request<PublicReservationDetail>(`/public/venues/${venueSlug}/reservations/${cancelSecret}`)
}

export function cancelReservation(venueSlug: string, cancelSecret: string, reason?: string) {
  return request<CancelReservationResponse>(`/public/venues/${venueSlug}/reservations/${cancelSecret}/cancel`, {
    method: 'POST',
    body: reason ? { reason } : {},
  })
}

export function createReservationDepositCheckout(token: string, venueSlug: string, cancelSecret: string) {
  return request<ReservationDepositCheckoutResponse>(`/consumer/venues/${venueSlug}/reservations/${cancelSecret}/payment`, {
    token,
    method: 'POST',
  })
}

export function finalizeReservationDepositCheckout(token: string, sessionId: string) {
  return request<FinalizeReservationDepositCheckoutResponse>('/consumer/reservations/deposit/finalize', {
    token,
    method: 'POST',
    body: { sessionId },
  })
}

export function getClassAvailability(venueSlug: string, input: { date: string; productId: string }) {
  const params = new URLSearchParams({
    date: input.date,
    productId: input.productId,
  })
  return request<ClassAvailabilityResponse>(`/public/venues/${venueSlug}/availability?${params.toString()}`)
}

export function getAvailability(venueSlug: string, input: { date: string; duration?: number; partySize?: number; productId?: string }) {
  const params = new URLSearchParams({ date: input.date })
  if (input.duration) params.set('duration', String(input.duration))
  if (input.partySize) params.set('partySize', String(input.partySize))
  if (input.productId) params.set('productId', input.productId)
  return request<ClassAvailabilityResponse>(`/public/venues/${venueSlug}/availability?${params.toString()}`)
}

export function getCreditPacks(venueSlug: string, productId?: string) {
  const params = new URLSearchParams()
  if (productId) params.set('productId', productId)
  const query = params.toString()
  return request<CreditPack[]>(`/public/venues/${venueSlug}/credit-packs${query ? `?${query}` : ''}`)
}

export function getCreditBalance(venueSlug: string, input: { email?: string; phone?: string; seats?: number; productId?: string }) {
  const params = new URLSearchParams()
  if (input.email) params.set('email', input.email)
  if (input.phone) params.set('phone', input.phone)
  if (input.seats != null) params.set('seats', String(input.seats))
  if (input.productId) params.set('productId', input.productId)
  return request<CreditBalanceResponse>(`/public/venues/${venueSlug}/credit-packs/balance?${params.toString()}`)
}

export function createCreditPackCheckout(
  token: string,
  venueSlug: string,
  packId: string,
) {
  return request<CreditPackCheckoutResponse>(`/consumer/venues/${venueSlug}/credit-packs/${packId}/checkout`, {
    token,
    method: 'POST',
  })
}

export function finalizeCreditPackCheckout(token: string, sessionId: string) {
  return request<FinalizeCreditCheckoutResponse>('/consumer/credits/checkout/finalize', {
    token,
    method: 'POST',
    body: { sessionId },
  })
}
