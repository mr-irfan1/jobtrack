import { SymbolView } from 'expo-symbols'
import { Link, Tabs } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { useIncomingShareLink } from '../../hooks/useIncomingShareLink'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useTheme } from '../../hooks/useTheme'

export default function AppLayout() {
  const { colors } = useTheme()
  useIncomingShareLink()
  usePushNotifications()

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.foreground,
        },
        headerRight: () => (
          <Link href="/(app)/notifications" asChild>
            <Pressable style={styles.headerBellButton}>
              {({ pressed }) => (
                <View style={[styles.bellContainer, { opacity: pressed ? 0.6 : 1 }]}>
                  <SymbolView
                    name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                    size={22}
                    tintColor={colors.foreground}
                  />
                  {/* UNREAD NOTIFICATION BADGE */}
                  <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                </View>
              )}
            </Pressable>
          </Link>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'JobTrack Dashboard',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          headerTitle: 'Job Applications',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'doc.text.fill', android: 'article', web: 'article' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: 'Pipeline',
          headerTitle: 'Application Pipeline',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'square.grid.3x1.below.line.grid.1x2', android: 'dashboard', web: 'dashboard' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="interviews"
        options={{
          title: 'Interviews',
          headerTitle: 'Scheduled Interviews',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'event', web: 'event' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Profile & Account',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
          headerTitle: 'Notifications & Alerts',
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          href: null,
          title: 'Import Job',
          headerTitle: 'Share to JobTrack',
        }}
      />
    </Tabs>
    </View>
  )
}

const styles = StyleSheet.create({
  headerBellButton: {
    marginRight: 16,
    padding: 4,
  },
  bellContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
})
