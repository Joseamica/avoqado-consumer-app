export type AuthProvider = 'GOOGLE' | 'APPLE'

export type Consumer = {
  id: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  locale: string
}

export type AuthResponse = {
  token: string
  consumer: Consumer
}

export type ProductType = 'APPOINTMENTS_SERVICE' | 'EVENT' | 'CLASS'

export type Product = {
  id: string
  name: string
  type: ProductType
  price: number | null
  duration: number | null
  eventCapacity?: number | null
  maxParticipants?: number | null
  layoutConfig?: unknown
  requireCreditForBooking?: boolean
}

export type VenueSummary = {
  id: string
  name: string
  slug: string
  logo: string | null
  type: string
  address: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  timezone: string
  primaryColor: string | null
  products: Product[]
}

export type VenueDetail = VenueSummary & {
  phone: string | null
  email: string | null
  website: string | null
  publicBooking: {
    enabled: boolean
    requirePhone: boolean
    requireEmail: boolean
  }
  operatingHours?: unknown
}

export type VenueSearchResponse = {
  venues: VenueSummary[]
}

export type ReservationResponse = {
  confirmationCode: string
  cancelSecret: string
  startsAt: string
  endsAt: string
  status: string
  depositRequired: boolean
  depositAmount: number | null
  checkoutUrl?: string | null
  creditRedeemed?: boolean
  creditsUsed?: number
}

export type ConsumerReservation = {
  confirmationCode: string
  cancelSecret: string
  status: string
  startsAt: string
  endsAt: string
  duration: number
  partySize: number
  spotIds?: string[]
  guestName?: string | null
  specialRequests?: string | null
  depositAmount?: number | string | null
  depositStatus?: string | null
  venue: {
    name: string
    slug: string
    logo?: string | null
    timezone?: string | null
  }
  product?: {
    id: string
    name: string
    price?: number | string | null
    type?: string
  } | null
}

export type PublicReservationDetail = {
  confirmationCode: string
  status: string
  startsAt: string
  endsAt: string
  duration: number
  partySize: number
  guestName?: string | null
  venue?: {
    name: string
    slug: string
    timezone?: string | null
  } | null
  product?: ConsumerReservation['product']
  assignedStaff?: { firstName: string; lastName: string } | null
  table?: { number: string } | null
  specialRequests?: string | null
  depositAmount?: number | string | null
  depositStatus?: string | null
  cancellation?: {
    allowed: boolean
    minHoursBeforeStart?: number | null
    creditsUsed?: number
    creditsRefundable?: number
    refundPercent?: number
    policyLabel?: string
  }
  reschedule?: {
    allowed: boolean
    minHoursBeforeStart?: number | null
    productId?: string | null
  }
}

export type CancelReservationResponse = {
  confirmationCode: string
  status: string
  cancelledAt?: string
  depositStatus?: string | null
  creditsRefunded?: number
  refundPolicy?: string | null
}

export type ConsumerReservationsResponse = {
  upcoming: ConsumerReservation[]
  past: ConsumerReservation[]
}

export type ClassAvailabilitySlot = {
  startsAt: string
  endsAt: string
  available: boolean
  classSessionId?: string
  capacity?: number
  enrolled?: number
  remaining?: number
}

export type ClassAvailabilityResponse = {
  date: string
  slots: ClassAvailabilitySlot[]
}

export type CreditPackItem = {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    type: string
    imageUrl?: string | null
    duration?: number | null
    price?: number | string | null
  }
}

export type CreditPack = {
  id: string
  name: string
  description?: string | null
  price: number | string
  currency: string
  validityDays?: number | null
  maxPerCustomer?: number | null
  items: CreditPackItem[]
}

export type CreditBalanceItem = {
  id: string
  productId: string
  remainingQuantity: number
  sufficient: boolean
  product: {
    id: string
    name: string
    type: string
    imageUrl?: string | null
  }
}

export type CreditBalancePurchase = {
  id: string
  expiresAt?: string | null
  creditPack: {
    name: string
  }
  itemBalances: CreditBalanceItem[]
}

export type CreditBalanceResponse = {
  customer: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
  } | null
  purchases: CreditBalancePurchase[]
  requestedSeats: number | null
}

export type ConsumerCreditBalance = {
  id: string
  originalQuantity: number
  remainingQuantity: number
  product: {
    id: string
    name: string
    type: string
    duration?: number | null
  }
}

export type ConsumerCreditPurchase = {
  id: string
  purchasedAt: string
  expiresAt?: string | null
  status: string
  amountPaid: number
  venue: {
    id: string
    name: string
    slug: string
    logo?: string | null
    timezone?: string | null
  }
  creditPack: {
    id: string
    name: string
  }
  itemBalances: ConsumerCreditBalance[]
}

export type ConsumerCreditsResponse = {
  totalRemaining: number
  purchases: ConsumerCreditPurchase[]
}

export type CreditPackCheckoutResponse = {
  checkoutUrl: string
}

export type ReservationDepositCheckoutResponse = {
  checkoutUrl: string
  reservationId: string
  confirmationCode: string
  depositAmount: number
}

export type FinalizeReservationDepositCheckoutResponse = {
  confirmationCode: string
  cancelSecret: string
  venueSlug: string
  status: string
  depositStatus?: string | null
  paymentStatus: string
}

export type FinalizeCreditCheckoutResponse = {
  purchaseId: string
  venueId: string
  creditPackId: string
  creditPackName: string
  status: string
  customerId: string
}
