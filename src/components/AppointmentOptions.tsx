import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { BookingStaff, ModifierGroup, ModifierSelection, Product } from '../api/types'
import { colors } from '../theme/colors'
import { radius, space } from '../theme/spacing'
import { fontFamilies, type } from '../theme/typography'
import type { Vertical } from '../theme/verticals'
import { Avatar } from './Avatar'
import { BodyText } from './BodyText'
import { Heading, Kicker } from './Heading'

type StaffPickerProps = {
  staff: BookingStaff[]
  selectedStaffId: string | null
  assignedStaffId?: string | null
  vertical: Vertical
  accent: { ink: string; deep: string; tint: string }
  onChange: (staffId: string | null) => void | Promise<void>
}

export function AppointmentStaffPicker({ staff, selectedStaffId, assignedStaffId, vertical, accent, onChange }: StaffPickerProps) {
  if (staff.length === 0) {
    return (
      <View style={styles.section}>
        <Kicker color={colors.muted}>Profesionista</Kicker>
        <Heading level="title">¿Con quién quieres reservar?</Heading>
        <View style={styles.emptyCard}>
          <BodyText color={colors.muted}>Nadie del equipo puede realizar este servicio por ahora.</BodyText>
        </View>
      </View>
    )
  }

  const assigned = assignedStaffId ? staff.find(member => member.id === assignedStaffId) : null
  return (
    <View style={styles.section}>
      <View>
        <Kicker color={colors.muted}>Profesionista</Kicker>
        <Heading level="title">¿Con quién quieres reservar?</Heading>
        <BodyText variant="bodySmall" color={colors.muted}>Elige a alguien o deja que encontremos a quien esté disponible.</BodyText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedStaffId === null }}
          onPress={() => { void onChange(null) }}
          style={[styles.staffCard, selectedStaffId === null ? { borderColor: accent.ink, backgroundColor: accent.tint } : null]}
        >
          <View style={[styles.anyoneAvatar, { backgroundColor: accent.ink }]}><Text style={styles.anyoneCheck}>✓</Text></View>
          <Text style={styles.staffName}>Cualquiera disponible</Text>
        </Pressable>
        {staff.map(member => {
          const selected = selectedStaffId === member.id
          return (
            <Pressable
              key={member.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => { void onChange(member.id) }}
              style={[styles.staffCard, selected ? { borderColor: accent.ink, backgroundColor: accent.tint } : null]}
            >
              <Avatar uri={member.photoUrl} fallback={member.name} vertical={vertical} size={48} shape="circle" />
              <Text style={[styles.staffName, selected ? { color: accent.deep } : null]} numberOfLines={2}>{member.name}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
      {selectedStaffId === null && assigned ? (
        <View style={[styles.assignmentNotice, { backgroundColor: accent.tint }]}>
          <BodyText variant="bodySmall" color={accent.deep}>Te atenderá {assigned.name}.</BodyText>
        </View>
      ) : null}
    </View>
  )
}

type ModifierPickerProps = {
  product: Product
  selections: ModifierSelection[]
  accent: { ink: string; deep: string; tint: string }
  onChange: (next: ModifierSelection[]) => void | Promise<void>
}

export function AppointmentModifierPicker({ product, selections, accent, onChange }: ModifierPickerProps) {
  const groups = product.modifierGroups ?? []
  if (groups.length === 0) return null

  function selectionsOutside(group: ModifierGroup) {
    const groupIds = new Set(group.modifiers.map(modifier => modifier.id))
    return selections.filter(selection => !groupIds.has(selection.modifierId))
  }

  function setQuantity(group: ModifierGroup, modifierId: string, quantity: number) {
    const outside = selectionsOutside(group)
    const inside = group.allowMultiple
      ? selections.filter(selection => group.modifiers.some(modifier => modifier.id === selection.modifierId) && selection.modifierId !== modifierId)
      : []
    const next = quantity > 0 ? [...outside, ...inside, { productId: product.id, modifierId, quantity }] : [...outside, ...inside]
    void onChange(next)
  }

  return (
    <View style={styles.section}>
      <View>
        <Kicker color={colors.muted}>Personaliza</Kicker>
        <Heading level="title">Complementos</Heading>
      </View>
      {groups.map(group => {
        const selectedCount = selections
          .filter(selection => group.modifiers.some(modifier => modifier.id === selection.modifierId))
          .reduce((count, selection) => count + selection.quantity, 0)
        const minimum = group.required ? Math.max(1, group.minSelections) : group.minSelections
        const invalid = selectedCount < minimum
        return (
          <View key={group.id} style={styles.modifierGroup}>
            <View style={styles.modifierHeader}>
              <View style={styles.modifierHeaderText}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.description ? <Text style={styles.groupDescription}>{group.description}</Text> : null}
              </View>
              <Text style={[styles.requirement, invalid ? styles.requirementInvalid : null]}>
                {group.required ? 'Requerido' : 'Opcional'}
              </Text>
            </View>
            {group.modifiers.map(modifier => {
              const selection = selections.find(row => row.modifierId === modifier.id)
              const quantity = selection?.quantity ?? 0
              const selected = quantity > 0
              const atMaximum = group.maxSelections != null && selectedCount >= group.maxSelections
              const choiceDisabled = group.allowMultiple && !selected && atMaximum
              return (
                <View key={modifier.id} style={[styles.modifierRow, selected ? { borderColor: accent.ink, backgroundColor: accent.tint } : null]}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled: choiceDisabled }}
                    disabled={choiceDisabled}
                    onPress={() => setQuantity(group, modifier.id, selected ? 0 : 1)}
                    style={[styles.modifierChoice, choiceDisabled ? styles.disabled : null]}
                  >
                    <View style={[styles.checkbox, selected ? { borderColor: accent.ink, backgroundColor: accent.ink } : null]}>
                      {selected ? <Text style={styles.checkboxCheck}>✓</Text> : null}
                    </View>
                    <View style={styles.modifierText}>
                      <Text style={styles.modifierName}>{modifier.name}</Text>
                      <Text style={styles.modifierMeta}>
                        {modifier.price > 0 ? `+${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(modifier.price)}` : 'Sin costo'}
                        {modifier.durationMin ? ` · +${modifier.durationMin} min` : ''}
                      </Text>
                    </View>
                  </Pressable>
                  {group.allowMultiple && selected ? (
                    <View style={styles.quantityControl}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${modifier.name}`} onPress={() => setQuantity(group, modifier.id, quantity - 1)} style={styles.quantityButton}><Text style={styles.quantityText}>−</Text></Pressable>
                      <Text style={styles.quantityValue}>{quantity}</Text>
                      <Pressable disabled={atMaximum} accessibilityRole="button" accessibilityLabel={`Agregar ${modifier.name}`} onPress={() => setQuantity(group, modifier.id, quantity + 1)} style={[styles.quantityButton, atMaximum ? styles.disabled : null]}><Text style={styles.quantityText}>+</Text></Pressable>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  rail: { gap: space.sm, paddingRight: space.xl },
  staffCard: { width: 154, minHeight: 118, padding: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: space.sm },
  staffName: { ...type.labelStrong, color: colors.text },
  anyoneAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  anyoneCheck: { color: colors.surface, fontFamily: fontFamilies.textBold, fontSize: 18 },
  emptyCard: { padding: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  assignmentNotice: { padding: space.sm, borderRadius: radius.md },
  modifierGroup: { gap: space.xs },
  modifierHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm },
  modifierHeaderText: { flex: 1, gap: 2 },
  groupName: { ...type.labelStrong, color: colors.text },
  groupDescription: { ...type.bodySmall, color: colors.muted },
  requirement: { ...type.caption, color: colors.muted },
  requirementInvalid: { color: colors.danger },
  modifierRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: space.sm, gap: space.sm },
  modifierChoice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxCheck: { color: colors.surface, fontFamily: fontFamilies.textBold },
  modifierText: { flex: 1, gap: 2 },
  modifierName: { ...type.labelStrong, color: colors.text },
  modifierMeta: { ...type.bodySmall, color: colors.muted },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  quantityButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  quantityText: { ...type.labelStrong, color: colors.text },
  quantityValue: { ...type.labelStrong, color: colors.text, minWidth: 18, textAlign: 'center' },
  disabled: { opacity: 0.42 },
})
