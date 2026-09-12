import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { getApplications, updateApplication } from '../../src/services/mobileApplicationRepository'
import type { ApplicationStatus, JobApplication } from '../../src/types/application'

const STAGE_COLUMNS: { key: string; title: string; targetStatus: ApplicationStatus; color: string }[] = [
  { key: 'saved', title: 'Saved', targetStatus: 'Wishlist', color: '#9CA3AF' },
  { key: 'applied', title: 'Applied', targetStatus: 'Applied', color: '#3B82F6' },
  { key: 'interview', title: 'Interview', targetStatus: 'Interview', color: '#F59E0B' },
  { key: 'offer', title: 'Offer', targetStatus: 'Offer', color: '#10B981' },
  { key: 'rejected', title: 'Rejected', targetStatus: 'Rejected', color: '#EF4444' },
]

export default function PipelineScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedColumn, setSelectedColumn] = useState<ApplicationStatus>('Applied')

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

  async function handleMoveStatus(app: JobApplication, nextStatus: ApplicationStatus) {
    try {
      const updated = await updateApplication({ ...app, status: nextStatus })
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (err: unknown) {
      console.error(err)
    }
  }

  const columnApps = applications.filter((a) => a.status === selectedColumn)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Application Pipeline</Text>
        <Text style={styles.subtitle}>Track every stage from saved to offer</Text>
      </View>

      {/* STAGE TABS / RAIL */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRail}>
        {STAGE_COLUMNS.map((col) => {
          const count = applications.filter((a) => a.status === col.targetStatus).length
          const isSelected = selectedColumn === col.targetStatus
          return (
            <TouchableOpacity
              key={col.key}
              onPress={() => setSelectedColumn(col.targetStatus)}
              style={[
                styles.tabItem,
                isSelected && { borderColor: col.color, backgroundColor: '#FFFFFF' },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: col.color }]} />
              <Text style={[styles.tabTitle, isSelected && { fontWeight: '700', color: '#111827' }]}>
                {col.title}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* COLUMN CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={columnApps}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.pipelineCard}>
              <Text style={styles.companyName}>{item.company}</Text>
              <Text style={styles.jobTitle}>{item.jobTitle}</Text>
              {item.location ? <Text style={styles.metaText}>📍 {item.location}</Text> : null}

              <Text style={styles.moveLabel}>Move to stage:</Text>
              <View style={styles.moveActions}>
                {STAGE_COLUMNS.map((col) => {
                  if (col.targetStatus === item.status) return null
                  return (
                    <TouchableOpacity
                      key={col.key}
                      onPress={() => handleMoveStatus(item, col.targetStatus)}
                      style={[styles.moveChip, { borderColor: col.color }]}
                    >
                      <Text style={[styles.chipText, { color: col.color }]}>
                        → {col.title}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No applications in this stage</Text>
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
  tabRail: { maxHeight: 54, paddingHorizontal: 16, marginBottom: 8 },
  tabItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  tabTitle: { fontSize: 13, color: '#4B5563', marginRight: 6 },
  countBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  pipelineCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 10 },
  companyName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  jobTitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  metaText: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  moveLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginTop: 12, marginBottom: 6 },
  moveActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  moveChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 14, color: '#9CA3AF' },
})
