import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { VenueSummary } from '../api/types'
import { colors } from '../theme/colors'
import { space } from '../theme/spacing'
import { fontFamilies, type } from '../theme/typography'
import { accentFor, detectVertical } from '../theme/verticals'

type VenueCardProps = {
  venue: VenueSummary
  onPress: () => void
  /** Featured cards take more vertical real estate and a wider hero ratio */
  featured?: boolean
}

function productLabel(venue: VenueSummary) {
  const product = venue.products[0]
  if (!product) return 'Reservas disponibles'
  if (product.type === 'CLASS') return 'Clases'
  if (product.type === 'EVENT') return 'Eventos'
  return 'Citas'
}

export function VenueCard({ venue, onPress, featured = false }: VenueCardProps) {
  const vertical = detectVertical({
    type: venue.type,
    name: venue.name,
    productType: venue.products[0]?.type ?? null,
  })
  const accent = accentFor(vertical)
  const monogram = (venue.name ?? '·').trim().slice(0, 1).toUpperCase() || '·'
  const product = venue.products[0]

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={venue.name}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View
        style={[
          styles.hero,
          featured ? styles.heroFeatured : styles.heroStandard,
          { backgroundColor: accent.tint },
        ]}
      >
        {/* Decorative monogram in deeper accent — fades behind the logo so even photo-less venues feel intentional */}
        <Text
          style={[styles.monogram, { color: accent.deep, opacity: 0.18 }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {monogram}
        </Text>

        {venue.logo ? (
          <Image source={{ uri: venue.logo }} style={styles.logoImage} resizeMode="cover" />
        ) : (
          <View style={[styles.crest, { borderColor: accent.deep }]}>
            <Text style={[styles.crestGlyph, { color: accent.deep }]}>{monogram}</Text>
          </View>
        )}

        <View style={[styles.heroBadge, { backgroundColor: accent.surface }]}>
          <Text style={[styles.heroBadgeText, { color: accent.deep }]}>{accent.label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[venue.city, venue.state].filter(Boolean).join(', ') || venue.address || 'CDMX'}
        </Text>
        {product ? (
          <View style={styles.productRow}>
            <Text style={[styles.productMark, { color: accent.deep }]}>—</Text>
            <Text style={styles.productText} numberOfLines={1}>
              {productLabel(venue)} · {product.name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroStandard: {
    aspectRatio: 16 / 11,
  },
  heroFeatured: {
    aspectRatio: 4 / 3,
  },
  monogram: {
    position: 'absolute',
    fontFamily: fontFamilies.displayBold,
    fontSize: 320,
    lineHeight: 320,
    bottom: -88,
    right: -32,
    letterSpacing: -8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  crest: {
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  crestGlyph: {
    ...type.display,
    fontSize: 36,
    lineHeight: 40,
  },
  heroBadge: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroBadgeText: {
    ...type.kicker,
    fontSize: 10,
  },
  body: {
    padding: space.md,
    gap: 4,
  },
  name: {
    ...type.subtitle,
    color: colors.text,
  },
  meta: {
    ...type.bodySmall,
    color: colors.muted,
  },
  productRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productMark: {
    ...type.label,
    fontFamily: fontFamilies.textSemibold,
  },
  productText: {
    ...type.label,
    color: colors.textSubtle,
    flex: 1,
  },
})
