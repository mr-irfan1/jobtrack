import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getApplications } from '../../src/services/mobileApplicationRepository'
import type { JobApplication } from '../../src/types/application'

interface NotificationItem {
  id: string
  title: string
  message: string
  date: string
  type: 'interview' | 'update' | 'system'
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const apps: JobApplication[] = await getApplications()
      const items: NotificationItem[] = []

      // Generate interview notifications
      apps.forEach((app) => {
        if (app.interviewDate) {
          items.push({
            id: `interview-${app.id}`,
            title: `Upcoming Interview: ${app.company}`,
            message: `Scheduled ${app.interviewType || 'Interview'} on ${app.interviewDate} ${app.interviewTime || ''}`,
            date: app.interviewDate,
            type: 'interview',
          })
        }
        if (app.status === 'Offer') {
          items.push({
            id: `offer-${app.id}`,
            title: `Offer Received 🎉`,
            message: `Congratulations! You received an offer from ${app.company} for ${app.jobTitle}.`,
            date: app.applicationDate,
            type: 'update',
          })
        }
      })

      // Add default welcome notification
      items.push({
        id: 'system-welcome',
        title: 'Welcome to JobTrack Mobile',
        message: 'Your applications and pipeline are synchronized across web and mobile.',
        date: new Date().toISOString().slice(0, 10),
        type: 'system',
      })

      setNotifications(items)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Stay informed on interview reminders and offer updates</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <Text style={styles.itemMessage}>{item.message}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No notifications</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  itemDate: { fontSize: 11, color: '#9CA3AF', marginLeft: 8 },
  itemMessage: { fontSize: 13, color: '#4B5563', marginTop: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 14, color: '#9CA3AF' },
})
