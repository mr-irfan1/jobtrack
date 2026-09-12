import React from 'react'
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../context/AuthContext'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const email = user?.email

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings & Account</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Profile</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email Address</Text>
          <Text style={styles.rowValue}>{email || 'Not signed in'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sync Status</Text>
          <Text style={[styles.rowValue, { color: '#10B981', fontWeight: '600' }]}>
            ● Cloud Synchronized
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0 (Native Expo)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Backend Provider</Text>
          <Text style={styles.rowValue}>Supabase Cloud</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out of JobTrack</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  section: { backgroundColor: '#FFFFFF', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#6B7280' },
  signOutButton: { backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  signOutText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
})
