import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Spacing } from '../../constants/theme'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useTheme } from '../../hooks/useTheme'

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus()
  const { colors } = useTheme()

  if (!isOffline) return null

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Text style={styles.bannerText}>
        📡 You&apos;re offline. Showing recently synced data.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
})
