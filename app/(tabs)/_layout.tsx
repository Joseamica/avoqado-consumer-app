import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { colors } from '../../src/theme/colors'
import { fontFamilies } from '../../src/theme/typography'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? colors.primary : colors.muted,
        fontSize: 20,
        lineHeight: 22,
        fontFamily: fontFamilies.textSemibold,
      }}
    >
      {label}
    </Text>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fontFamilies.textSemibold,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 78,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} /> }} />
      <Tabs.Screen
        name="reservations"
        options={{ title: 'Reservas', tabBarIcon: ({ focused }) => <TabIcon label="◷" focused={focused} /> }}
      />
      <Tabs.Screen name="credits" options={{ title: 'Créditos', tabBarIcon: ({ focused }) => <TabIcon label="◆" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} /> }} />
    </Tabs>
  )
}
