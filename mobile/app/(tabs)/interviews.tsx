import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { getApplications } from '../../src/services/mobileApplicationRepository'
import type { JobApplication } from '../../src/types/application'

export default function InterviewsScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const data = await getApplications()
      setApplications(data)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const interviewApps = applications.filter((a) => a.interviewDate)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled Interviews</Text>
        <Text style={styles.subtitle}>
          {interviewApps.length} interview sessions scheduled
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={interviewApps}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.companyName}>{item.company}</Text>
                  <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                </View>
                {item.interviewType ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.interviewType}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  📅 {item.interviewDate} {item.interviewTime ? `at ${item.interviewTime}` : ''}
                </Text>
              </View>

              {item.meetingLink ? (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => Linking.openURL(item.meetingLink!)}
                >
                  <Text style={styles.joinButtonText}>Join Meeting &rarr;</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No scheduled interviews yet</Text>
              <Text style={styles.emptySubtitle}>
                Add interview details to any job application to track dates & meeting links.
              </Text>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  jobTitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  badge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  timeContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  timeText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  joinButton: { marginTop: 10, backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  joinButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
})
