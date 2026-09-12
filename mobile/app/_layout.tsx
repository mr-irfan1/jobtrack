import { useFonts } from 'expo-font'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'

export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <AuthProvider>
      <ProtectedNavigation />
    </AuthProvider>
  )
}

function ProtectedNavigation() {
  const { session, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const { colors } = useTheme()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // Redirect unauthenticated user to login screen
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Redirect authenticated user to main app layout
      router.replace('/(app)')
    }
  }, [session, isLoading, segments, router])

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <Slot />
}
