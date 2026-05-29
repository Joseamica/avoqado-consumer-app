import { colors } from './colors'

/**
 * Vertical-aware accents. The master design system stays consistent — these are
 * subtle filters layered on the same components. Never a parallel component
 * library.
 *
 * Mapping is forgiving: backend `venue.type` strings vary, so we match by
 * substring on common service categories. Default falls back to "wellness"
 * (the warmest, safest default for unknown verticals).
 */
export type Vertical = 'wellness' | 'healthcare' | 'retail'

export type VerticalAccent = {
  /** Primary accent for badges, focused chips, kickers */
  ink: string
  /** Soft tint for chip backgrounds, hero washes */
  tint: string
  /** Deep accent for pressed/hover states */
  deep: string
  /** Optional surface-on-tint pairing */
  surface: string
  /** Short label, used as a kicker */
  label: string
  /** Mexican Spanish single-word descriptor for the vertical */
  descriptor: string
}

export const verticalAccents: Record<Vertical, VerticalAccent> = {
  wellness: {
    ink: colors.accentDeep,
    tint: colors.accentTint,
    deep: '#7E4A1F',
    surface: '#FFF8EE',
    label: 'Bienestar',
    descriptor: 'cálido',
  },
  healthcare: {
    ink: '#2C5C58',
    tint: '#DDE9E6',
    deep: '#1B3F3C',
    surface: '#F2F6F4',
    label: 'Salud',
    descriptor: 'sereno',
  },
  retail: {
    ink: colors.ink,
    tint: colors.inkTint,
    deep: '#000000',
    surface: '#F8F4EA',
    label: 'Atelier',
    descriptor: 'editorial',
  },
}

const wellnessHints = [
  'spa', 'salon', 'salón', 'beauty', 'belle', 'belleza', 'barber', 'barbería', 'barberia',
  'hair', 'pelo', 'nail', 'uñ', 'lash', 'pestañ', 'pestan', 'wax', 'depil',
  'fitness', 'gym', 'gimnasio', 'yoga', 'pilates', 'crossfit', 'cycling', 'spinning',
  'boxing', 'box', 'dance', 'baile', 'studio', 'estudio', 'training', 'entrenamiento',
  'wellness', 'bienestar', 'massage', 'masaje', 'facial', 'aesthetic', 'estetic',
]

const healthcareHints = [
  'dental', 'dentist', 'odonto', 'medical', 'medic', 'clinic', 'clínica', 'clinica',
  'doctor', 'health', 'salud', 'therapy', 'terapia', 'psych', 'psico',
  'physio', 'fisio', 'chiro', 'quiro', 'optic', 'óptic', 'vision', 'visión',
  'derm', 'derma', 'pediatric', 'pediátric',
]

const retailHints = [
  'jewel', 'joy', 'joyer', 'atelier', 'boutique', 'showroom', 'gallery', 'galería',
  'galeria', 'studio gallery', 'taller', 'workshop',
]

function normalize(value: string | null | undefined) {
  return (value ?? '').toString().trim().toLowerCase()
}

function matchesAny(value: string, hints: string[]) {
  if (!value) return false
  return hints.some(hint => value.includes(hint))
}

/**
 * Detect the vertical from venue type / name / first product. Order matters —
 * healthcare wins ties because mis-classifying a clinic as "wellness" would
 * undercut the trust signal.
 */
export function detectVertical(input: { type?: string | null; name?: string | null; productType?: string | null }): Vertical {
  const corpus = [normalize(input.type), normalize(input.name), normalize(input.productType)].join(' ')
  if (matchesAny(corpus, healthcareHints)) return 'healthcare'
  if (matchesAny(corpus, retailHints)) return 'retail'
  if (matchesAny(corpus, wellnessHints)) return 'wellness'
  return 'wellness'
}

export function accentFor(vertical: Vertical): VerticalAccent {
  return verticalAccents[vertical]
}
