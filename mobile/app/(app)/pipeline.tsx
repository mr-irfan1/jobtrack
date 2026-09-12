import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ApplicationCard } from '../../components/applications/ApplicationCard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Heading } from '../../components/ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import {
  deleteApplication,
  getApplications,
  updateApplication,
} from '../../services/mobileApplicationRepository'
import { sendStatusChangeNotification } from '../../services/mobilePushNotificationService'
import type { ApplicationStatus, JobApplication } from '../../types/application'

const PIPELINE_STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'Wishlist', label: 'Wishlist' },
  { status: 'Applied', label: 'Applied' },
  { status: 'Interview', label: 'Interview' },
  { status: 'Offer', label: 'Offer' },
  { status: 'Rejected', label: 'Rejected' },
]

export default function MobilePipelineScreen() {
  const { colors } = useTheme()
  const router = useRouter()

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [activeStage, setActiveStage] = useState<ApplicationStatus>('Applied')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status Changer Modal / Action Sheet State
  const [targetApp, setTargetApp] = useState<JobApplication | null>(null)
  const [isMoveSheetOpen, setIsMoveSheetOpen] = useState(false)

  const loadPipelineData = useCallback(async (isPullToRefresh = false) => {
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
          : 'Failed to load pipeline applications. Pull down to refresh.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadPipelineData()
  }, [loadPipelineData])

  // STAGE COUNTS COMPUTATION
  const stageCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      Wishlist: 0,
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    }
    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++
      }
    })
    return counts
  }, [applications])

  // APPLICATIONS FOR SELECTED STAGE
  const stageApplications = useMemo(() => {
    return applications
      .filter((app) => app.status === activeStage)
      .sort(
        (a, b) =>
          new Date(b.applicationDate).getTime() -
          new Date(a.applicationDate).getTime(),
      )
  }, [applications, activeStage])

  // OPTIMISTIC STATUS CHANGE WITH REVERT ON FAILURE
  async function handleOptimisticStatusChange(
    app: JobApplication,
    nextStatus: ApplicationStatus,
  ) {
    if (app.status === nextStatus) {
      setIsMoveSheetOpen(false)
      setTargetApp(null)
      return
    }

    const previousApplications = [...applications]
    const updatedApp: JobApplication = { ...app, status: nextStatus }

    // 1. Optimistically update local state immediately
    setApplications((prev) =>
      prev.map((item) => (item.id === app.id ? updatedApp : item)),
    )
    setIsMoveSheetOpen(false)
    setTargetApp(null)

    // 2. Persist to Supabase backend
    try {
      await updateApplication(updatedApp)
      sendStatusChangeNotification(
        app.company,
        app.jobTitle,
        nextStatus,
        app.id,
      ).catch(() => {})
    } catch {
      // 3. On failure: revert local state and alert user
      setApplications(previousApplications)
      Alert.alert(
        'Status Update Failed',
        'Unable to update the application stage on the server. Your change has been reverted.',
      )
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
            const previousApplications = [...applications]
            setApplications((prev) => prev.filter((a) => a.id !== id))
            try {
              await deleteApplication(id)
            } catch {
              setApplications(previousApplications)
              Alert.alert('Error', 'Failed to delete application from the server.')
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HORIZONTAL STAGE SELECTOR TABS */}
      <View style={[styles.stageTabsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsScroll}
        >
          {PIPELINE_STAGES.map((stage) => {
            const isSelected = activeStage === stage.status
            const count = stageCounts[stage.status]
            return (
              <TouchableOpacity
                key={stage.status}
                style={[
                  styles.stageTab,
                  {
                    borderBottomColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setActiveStage(stage.status)}
              >
                <Text
                  style={[
                    styles.stageTabLabel,
                    {
                      color: isSelected ? colors.primary : colors.mutedForeground,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {stage.label}
                </Text>
                <View
                  style={[
                    styles.stageBadge,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stageBadgeText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.mutedForeground,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ERROR STATE */}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Button title="Retry" size="sm" onPress={() => loadPipelineData()} />
        </View>
      ) : null}

      {/* MAIN APPLICATIONS LIST FOR ACTIVE STAGE */}
      {loading && !refreshing ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
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
          data={stageApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPipelineData(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ApplicationCard
                application={item}
                onPress={() => router.push(`/(app)/applications/${item.id}`)}
                onEdit={() => {
                  setTargetApp(item)
                  setIsMoveSheetOpen(true)
                }}
                onDelete={() => handleDeleteConfirm(item.id)}
              />
              <TouchableOpacity
                style={[styles.moveStageBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => {
                  setTargetApp(item)
                  setIsMoveSheetOpen(true)
                }}
              >
                <Text style={[styles.moveStageBtnText, { color: colors.primary }]}>
                  ⇄ Change Stage ({item.status})
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Heading style={{ fontSize: 16, textAlign: 'center', marginBottom: Spacing.xs }}>
                No Applications in &ldquo;{activeStage}&rdquo;
              </Heading>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                You have no applications currently at this stage. Move an application here or create a new one.
              </Text>
              <Button
                title="View All Applications"
                variant="outline"
                onPress={() => router.push('/(app)/applications')}
              />
            </Card>
          }
        />
      )}

      {/* STAGE MOVER MODAL / BOTTOM SHEET */}
      <Modal
        visible={Boolean(isMoveSheetOpen && targetApp)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsMoveSheetOpen(false)
          setTargetApp(null)
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Heading style={{ fontSize: 18 }}>Move Application</Heading>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  {targetApp?.company} &bull; {targetApp?.jobTitle}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => {
                  setIsMoveSheetOpen(false)
                  setTargetApp(null)
                }}
              >
                <Text style={[styles.sheetCloseText, { color: colors.mutedForeground }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetInstruction, { color: colors.mutedForeground }]}>
              Select target pipeline stage:
            </Text>

            <View style={styles.stageOptionsList}>
              {PIPELINE_STAGES.map((st) => {
                const isCurrent = targetApp?.status === st.status
                return (
                  <TouchableOpacity
                    key={st.status}
                    style={[
                      styles.stageOptionItem,
                      {
                        backgroundColor: isCurrent ? colors.primary + '15' : colors.background,
                        borderColor: isCurrent ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (targetApp) handleOptimisticStatusChange(targetApp, st.status)
                    }}
                  >
                    <Text
                      style={[
                        styles.stageOptionText,
                        {
                          color: isCurrent ? colors.primary : colors.foreground,
                          fontWeight: isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {st.label} {isCurrent ? '(Current Stage)' : ''}
                    </Text>
                    <Text style={{ color: isCurrent ? colors.primary : colors.mutedForeground }}>
                      →
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stageTabsContainer: {
    borderBottomWidth: 1,
  },
  stageTabsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 3,
    gap: Spacing.xs,
  },
  stageTabLabel: {
    fontSize: TypographyTokens.sizes.sm,
  },
  stageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: TypographyTokens.sizes.xs - 1,
    fontWeight: TypographyTokens.weights.bold,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  moveStageBtn: {
    marginTop: -Spacing.xs,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  moveStageBtnText: {
    fontSize: TypographyTokens.sizes.xs,
    fontWeight: TypographyTokens.weights.semibold,
  },
  errorBox: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: TypographyTokens.sizes.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sheetSubtitle: {
    fontSize: TypographyTokens.sizes.xs + 1,
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetCloseText: {
    fontSize: 20,
    fontWeight: '600',
  },
  sheetInstruction: {
    fontSize: TypographyTokens.sizes.xs,
    fontWeight: TypographyTokens.weights.semibold,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  stageOptionsList: {
    gap: Spacing.sm,
  },
  stageOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  stageOptionText: {
    fontSize: TypographyTokens.sizes.sm,
  },
})
