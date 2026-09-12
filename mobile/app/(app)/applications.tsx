import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ApplicationCard } from '../../components/applications/ApplicationCard'
import { ApplicationDetails } from '../../components/applications/ApplicationDetails'
import { ApplicationForm } from '../../components/applications/ApplicationForm'
import { JobUrlImportModal } from '../../components/applications/JobUrlImportModal'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { Heading } from '../../components/ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import {
  addApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from '../../services/mobileApplicationRepository'
import type { ApplicationStatus, JobApplication } from '../../types/application'

type SortOption = 'date_desc' | 'date_asc' | 'company_asc'

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Wishlist', label: 'Wishlist' },
  { key: 'Applied', label: 'Applied' },
  { key: 'Interview', label: 'Interview' },
  { key: 'Offer', label: 'Offer' },
  { key: 'Rejected', label: 'Rejected' },
]

export default function MobileApplicationsScreen() {
  const { colors } = useTheme()
  const router = useRouter()

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')

  // Modal States
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [formInitialData, setFormInitialData] = useState<JobApplication | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)

  const loadApplicationsData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true)
    else setLoading(true)

    setError(null)

    try {
      const data = await getApplications()
      setApplications(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load applications. Pull down to try again.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadApplicationsData()
  }, [loadApplicationsData])

  // CREATE / UPDATE HANDLER
  async function handleFormSubmit(app: JobApplication) {
    if (formInitialData) {
      const updated = await updateApplication(app)
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      if (selectedApp && selectedApp.id === updated.id) {
        setSelectedApp(updated)
      }
    } else {
      const created = await addApplication(app)
      setApplications((prev) => [...prev, created])
    }
  }

  // STATUS CHANGE HANDLER
  async function handleStatusChange(app: JobApplication, nextStatus: ApplicationStatus) {
    try {
      const updated = await updateApplication({ ...app, status: nextStatus })
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      if (selectedApp && selectedApp.id === updated.id) {
        setSelectedApp(updated)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // DELETE CONFIRMATION HANDLER
  function handleDeleteConfirm(id: string) {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(id)
              setApplications((prev) => prev.filter((a) => a.id !== id))
              if (selectedApp && selectedApp.id === id) {
                setIsDetailsOpen(false)
                setSelectedApp(null)
              }
            } catch (err) {
              console.error(err)
            }
          },
        },
      ],
    )
  }

  // FILTERED & SORTED APPLICATIONS
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch =
          !search.trim() ||
          app.company.toLowerCase().includes(search.toLowerCase()) ||
          app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
          app.location.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === 'ALL' || app.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return (
            new Date(b.applicationDate).getTime() -
            new Date(a.applicationDate).getTime()
          )
        }
        if (sortBy === 'date_asc') {
          return (
            new Date(a.applicationDate).getTime() -
            new Date(b.applicationDate).getTime()
          )
        }
        if (sortBy === 'company_asc') {
          return a.company.localeCompare(b.company)
        }
        return 0
      })
  }, [applications, search, statusFilter, sortBy])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOOLBAR & SEARCH */}
      <View style={styles.topToolbar}>
        <View style={styles.searchRow}>
          <Input
            placeholder="Search company, role, location..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={[styles.importUrlBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={() => setIsUrlModalOpen(true)}
          >
            <Text style={[styles.importUrlBtnText, { color: colors.primary }]}>🔗 URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addFab, { backgroundColor: colors.primary }]}
            onPress={() => {
              setFormInitialData(null)
              setIsFormOpen(true)
            }}
          >
            <Text style={styles.addFabText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* STATUS FILTER CHIPS */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterChipContainer}
          renderItem={({ item }) => {
            const isSelected = statusFilter === item.key
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setStatusFilter(item.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : colors.foreground },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          }}
        />

        {/* SORT TOGGLE */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>
            Sorted by:
          </Text>
          <TouchableOpacity
            style={[styles.sortBtn, { borderColor: colors.border }]}
            onPress={() => {
              if (sortBy === 'date_desc') setSortBy('date_asc')
              else if (sortBy === 'date_asc') setSortBy('company_asc')
              else setSortBy('date_desc')
            }}
          >
            <Text style={[styles.sortBtnText, { color: colors.foreground }]}>
              {sortBy === 'date_desc'
                ? 'Date (Newest)'
                : sortBy === 'date_asc'
                  ? 'Date (Oldest)'
                  : 'Company A-Z'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ERROR STATE */}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Button title="Retry" size="sm" onPress={() => loadApplicationsData()} />
        </View>
      ) : null}

      {/* MAIN APPLICATIONS LIST */}
      {loading && !refreshing ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={{ padding: Spacing.lg, marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Skeleton height={18} width="40%" />
                <Skeleton height={18} width={60} borderRadius={10} />
              </View>
              <Skeleton height={14} width="70%" style={{ marginBottom: Spacing.sm }} />
              <Skeleton height={12} width="30%" />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList<JobApplication>
          data={filteredApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadApplicationsData(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <ApplicationCard
              application={item}
              onPress={() => {
                router.push(`/(app)/applications/${item.id}`)
              }}
              onEdit={() => {
                setFormInitialData(item)
                setIsFormOpen(true)
              }}
              onDelete={() => handleDeleteConfirm(item.id)}
            />
          )}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Heading style={{ fontSize: 16, textAlign: 'center', marginBottom: Spacing.xs }}>
                No Applications Found
              </Heading>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {search || statusFilter !== 'ALL'
                  ? 'No applications match your search filters.'
                  : 'You have not added any job applications yet.'}
              </Text>
              <Button
                title="+ Add Application"
                onPress={() => {
                  setFormInitialData(null)
                  setIsFormOpen(true)
                }}
              />
            </Card>
          }
        />
      )}

      {/* APPLICATION DETAILS MODAL */}
      <ApplicationDetails
        application={selectedApp}
        visible={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(app) => {
          setFormInitialData(app)
          setIsFormOpen(true)
        }}
        onDelete={handleDeleteConfirm}
        onStatusChange={handleStatusChange}
      />

      {/* ADD / EDIT FORM MODAL */}
      <ApplicationForm
        visible={isFormOpen}
        initialData={formInitialData}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* IMPORT FROM JOB URL MODAL */}
      <JobUrlImportModal
        visible={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onConfirmAdd={async (newApp) => {
          const created = await addApplication(newApp)
          setApplications((prev) => [...prev, created])
        }}
        onManualFallback={(prefillData) => {
          setFormInitialData(prefillData as JobApplication)
          setIsFormOpen(true)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topToolbar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  importUrlBtn: {
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importUrlBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
  filterChipContainer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: TypographyTokens.sizes.xs + 1,
    fontWeight: TypographyTokens.weights.medium,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xs,
  },
  sortLabel: {
    fontSize: TypographyTokens.sizes.xs,
    marginRight: Spacing.xs,
  },
  sortBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  sortBtnText: {
    fontSize: TypographyTokens.sizes.xs,
    fontWeight: TypographyTokens.weights.semibold,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  errorBox: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: TypographyTokens.sizes.xs,
    flex: 1,
    marginRight: Spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: TypographyTokens.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
})
