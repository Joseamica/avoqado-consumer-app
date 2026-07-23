import type { ModifierGroup, ModifierSelection, Product } from '../api/types'

export type ApiErrorShape = Error & { status?: number; code?: string; details?: unknown }

export function modifierDurationDelta(product: Product | null, selections: ModifierSelection[]) {
  if (!product) return 0
  const activeModifiers = new Map(
    (product.modifierGroups ?? []).flatMap(group =>
      group.modifiers.filter(modifier => modifier.active !== false).map(modifier => [modifier.id, modifier] as const),
    ),
  )
  return selections.reduce((total, selection) => {
    const modifier = activeModifiers.get(selection.modifierId)
    return total + (modifier?.durationMin ?? 0) * selection.quantity
  }, 0)
}

export function baseWindowFromFinalSlot(
  slot: { startsAt: string; endsAt: string },
  product: Product,
  selections: ModifierSelection[],
) {
  const startsAt = new Date(slot.startsAt)
  const finalEndsAt = new Date(slot.endsAt)
  const endsAt = new Date(finalEndsAt.getTime() - modifierDurationDelta(product, selections) * 60_000)
  const duration = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000)
  if (!Number.isFinite(duration) || duration < 1) throw new Error('La ventana base de la cita no es válida.')
  return { startsAt, endsAt, duration }
}

export function modifierGroupSelectionCount(group: ModifierGroup, selections: ModifierSelection[]) {
  const modifierIds = new Set(group.modifiers.map(modifier => modifier.id))
  return selections
    .filter(selection => modifierIds.has(selection.modifierId))
    .reduce((count, selection) => count + selection.quantity, 0)
}

export function modifiersAreValid(product: Product | null, selections: ModifierSelection[]) {
  if (!product) return false
  return (product.modifierGroups ?? []).every(group => {
    const count = modifierGroupSelectionCount(group, selections)
    const minimum = group.required ? Math.max(1, group.minSelections) : group.minSelections
    if (count < minimum) return false
    if (group.maxSelections != null && count > group.maxSelections) return false
    if (!group.allowMultiple) {
      const modifierIds = new Set(group.modifiers.map(modifier => modifier.id))
      const distinct = selections.filter(selection => modifierIds.has(selection.modifierId)).length
      if (distinct > 1) return false
    }
    return true
  })
}

export function reconcileModifiers(product: Product, selections: ModifierSelection[]) {
  const validIds = new Set(
    (product.modifierGroups ?? []).flatMap(group =>
      group.modifiers.filter(modifier => modifier.active !== false).map(modifier => modifier.id),
    ),
  )
  return selections.filter(selection => selection.productId === product.id && validIds.has(selection.modifierId))
}

export function appointmentWindowExpectedBase(error: unknown): number | null {
  const candidate = (error as ApiErrorShape | undefined)?.details as { expectedBaseDurationMin?: unknown } | undefined
  const value = candidate?.expectedBaseDurationMin
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null
}
