import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { searchVenues } from '../../src/api/client'
import { BodyText } from '../../src/components/BodyText'
import { Heading, Kicker } from '../../src/components/Heading'
import { VenueCard } from '../../src/components/VenueCard'
import { VerticalChip } from '../../src/components/VerticalChip'
import { useAuthStore } from '../../src/store/authStore'
import { colors } from '../../src/theme/colors'
import { space } from '../../src/theme/spacing'
import { fontFamilies, type } from '../../src/theme/typography'
import { detectVertical, type Vertical } from '../../src/theme/verticals'

const FILTERS: Array<{ key: Vertical | 'all'; label: string }> = [
  { key: 'all', label: 'Todo' },
  { key: 'wellness', label: 'Bienestar' },
  { key: 'healthcare', label: 'Salud' },
  { key: 'retail', label: 'Atelier' },
]

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const token = useAuthStore(state => state.token)
  const consumer = useAuthStore(state => state.consumer)
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<Vertical | 'all'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(query.trim())
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  const venuesQuery = useQuery({
    queryKey: ['venues', searchTerm],
    queryFn: () => searchVenues(token!, searchTerm),
    enabled: Boolean(token),
  })

  const refreshVenues = async () => {
    setIsRefreshing(true)
    try {
      await venuesQuery.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Buen día' : greetingHour < 19 ? 'Buena tarde' : 'Buena noche'
  const firstName = consumer?.firstName?.trim()
  const initial = (firstName ?? consumer?.email ?? '·').slice(0, 1).toUpperCase()

  const venues = venuesQuery.data?.venues ?? []
  const filtered = useMemo(() => {
    if (filter === 'all') return venues
    return venues.filter(
      v => detectVertical({ type: v.type, name: v.name, productType: v.products[0]?.type ?? null }) === filter,
    )
  }, [venues, filter])

  const featured = filtered[0] ?? null
  const rest = filtered.slice(1)

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.xs }]}>
      <FlatList
        data={rest}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + space.xxxl }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={isRefreshing}
        onRefresh={refreshVenues}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.topRow}>
              <View style={styles.greetingBlock}>
                <Kicker color={colors.muted}>{greeting}</Kicker>
                <Heading level="display" style={styles.headline}>
                  {firstName ? (
                    <>
                      Hola{'\n'}
                      <Text style={styles.headlineItalic}>{firstName}.</Text>
                    </>
                  ) : (
                    <>
                      Encuentra{'\n'}
                      <Text style={styles.headlineItalic}>tu próximo lugar.</Text>
                    </>
                  )}
                </Heading>
              </View>
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Abrir perfil"
                style={({ pressed }) => [styles.avatarBtn, pressed ? styles.pressed : null]}
              >
                <Text style={styles.avatarGlyph}>{initial}</Text>
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Text style={styles.searchGlyph}>⌕</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Estudio, salón, clínica…"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTERS}
              keyExtractor={item => item.key}
              contentContainerStyle={styles.filtersRow}
              renderItem={({ item }) => (
                <VerticalChip
                  vertical={item.key}
                  label={item.label}
                  active={filter === item.key}
                  onPress={() => setFilter(item.key)}
                />
              )}
            />

            <Pressable
              onPress={() => router.push('/reservations')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.reservationsCard, pressed ? styles.pressed : null]}
            >
              <View style={styles.reservationsText}>
                <Kicker color={colors.accentDeep}>Para ti</Kicker>
                <Text style={styles.reservationsTitle}>Mis reservas</Text>
                <Text style={styles.reservationsHint}>Citas, clases y créditos en un solo lugar.</Text>
              </View>
              <Text style={styles.reservationsArrow}>→</Text>
            </Pressable>

            {venuesQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {venuesQuery.isError ? <BodyText color={colors.danger}>{venuesQuery.error.message}</BodyText> : null}

            {featured ? (
              <View style={styles.featuredBlock}>
                <View style={styles.featuredHeader}>
                  <Kicker color={colors.muted}>Destacado</Kicker>
                  <Text style={styles.featuredCount}>
                    {filtered.length} {filtered.length === 1 ? 'lugar' : 'lugares'}
                  </Text>
                </View>
                <VenueCard featured venue={featured} onPress={() => router.push(`/venues/${featured.slug}`)} />
              </View>
            ) : null}

            {rest.length > 0 ? (
              <View style={styles.listHeader}>
                <Kicker color={colors.muted}>Curados para hoy</Kicker>
                <Heading level="title">Todo lo demás</Heading>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <VenueCard venue={item} onPress={() => router.push(`/venues/${item.slug}`)} />}
        ListEmptyComponent={
          !venuesQuery.isLoading && !featured ? (
            <View style={styles.empty}>
              <Heading level="subtitle">Nada por aquí todavía</Heading>
              <BodyText color={colors.muted}>
                Prueba otra búsqueda o cambia la categoría — pronto sumamos más lugares en tu zona.
              </BodyText>
            </View>
          ) : null
        }
      />

    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: space.xl,
  },
  separator: {
    height: space.md,
  },
  headerBlock: {
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: space.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
  },
  greetingBlock: {
    flex: 1,
    gap: space.xxs,
  },
  headline: {
    color: colors.text,
  },
  headlineItalic: {
    fontFamily: fontFamilies.displayItalic,
    color: colors.accentDeep,
  },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontFamily: fontFamilies.displayBold,
    color: colors.text,
    fontSize: 18,
    lineHeight: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchGlyph: {
    color: colors.muted,
    fontSize: 22,
    lineHeight: 22,
    fontFamily: fontFamilies.text,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    ...type.body,
    fontFamily: fontFamilies.text,
    fontSize: 16,
  },
  filtersRow: {
    gap: space.xs,
    paddingRight: space.lg,
  },
  reservationsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentTint,
    borderRadius: 22,
    padding: space.lg,
    gap: space.md,
  },
  reservationsText: {
    flex: 1,
    minWidth: 0,
  },
  reservationsTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginTop: 4,
  },
  reservationsHint: {
    ...type.bodySmall,
    color: colors.accentDeep,
    marginTop: 2,
  },
  reservationsArrow: {
    color: colors.accentDeep,
    fontFamily: fontFamilies.text,
    fontSize: 28,
    lineHeight: 30,
  },
  loader: {
    marginVertical: space.lg,
  },
  featuredBlock: {
    gap: space.sm,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featuredCount: {
    ...type.caption,
    color: colors.muted,
    letterSpacing: 0.6,
    paddingBottom: 2,
  },
  listHeader: {
    paddingTop: space.sm,
  },
  empty: {
    paddingVertical: space.xxl,
    alignItems: 'flex-start',
    gap: space.xs,
  },
  pressed: {
    opacity: 0.85,
  },
})
