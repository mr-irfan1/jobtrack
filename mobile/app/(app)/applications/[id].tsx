import { useLocalSearchParams, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ApplicationForm } from '../../../components/applications/ApplicationForm'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { BodyText, Heading, Subheading } from '../../../components/ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../../constants/theme'
import { useTheme } from '../../../hooks/useTheme'
import {
  deleteApplication,
  getApplications,
  updateApplication,
} from '../../../services/mobileApplicationRepository'
import type { ApplicationStatus, JobApplication } from '../../../types/application'

const ALL_STATUSES: ApplicationStatus[] = [
  'Wishlist',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)

  const loadApplicationDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const allApps = await getApplications()
      const found = allApps.find((a) => a.id === id)
      if (found) {
        setApplication(found)
      } else {
        setError('Application not found.')
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load application details.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadApplicationDetail()
  }, [loadApplicationDetail])

  // STATUS CHANGE HANDLER
  async function handleStatusChange(nextStatus: ApplicationStatus) {
    if (!application) return
    try {
      const updated = await updateApplication({
        ...application,
        status: nextStatus,
      })
      setApplication(updated)
    } catch {
      Alert.alert('Error', 'Failed to update application status.')
    }
  }

  // UPDATE APPLICATION HANDLER
  async function handleUpdateSubmit(updatedApp: JobApplication) {
    try {
      const result = await updateApplication(updatedApp)
      setApplication(result)
      setIsEditOpen(false)
    } catch {
      Alert.alert('Error', 'Failed to update application details.')
    }
  }

  // DELETE CONFIRMATION HANDLER
  function handleDeletePrompt() {
    if (!application) return
    Alert.alert(
      'Delete Application',
      `Are you sure you want to delete the application for ${application.company}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(application.id)
              router.back()
            } catch {
              Alert.alert('Error', 'Failed to delete application.')
            }
          },
        },
      ],
    )
  }

  // OPEN EXTERNAL URL HANDLER
  async function handleOpenUrl() {
    if (!application?.jobUrl) return
    try {
      await WebBrowser.openBrowserAsync(application.jobUrl)
    } catch {
      Linking.openURL(application.jobUrl)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading application details...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !application) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>
            {error || 'Application not found.'}
          </Text>
          <Button
            title="← Back to Applications"
            variant="outline"
            style={{ marginTop: Spacing.md }}
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* BACK NAVIGATION */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>
            ← Back to Applications
          </Text>
        </TouchableOpacity>

        {/* HERO COMPANY CARD */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Heading style={{ fontSize: 24, color: colors.foreground }}>
                {application.company}
              </Heading>
              <Subheading
                style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 2 }}
              >
                {application.jobTitle}
              </Subheading>
            </View>
            <StatusBadge status={application.status} />
          </View>

          {application.location ? (
            <BodyText style={{ marginTop: Spacing.sm, color: colors.mutedForeground }}>
              📍 {application.location}
            </BodyText>
          ) : null}

          {/* JOB URL ACTION BUTTON */}
          {application.jobUrl ? (
            <Button
              title="Open External Job Posting 🔗"
              variant="outline"
              size="md"
              style={{ marginTop: Spacing.md }}
              onPress={handleOpenUrl}
            />
          ) : null}
        </Card>

        {/* QUICK STATUS CHANGER */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            APPLICATION STATUS
          </Text>
          <View style={styles.statusChipsRow}>
            {ALL_STATUSES.map((st) => {
              const isSelected = application.status === st
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleStatusChange(st)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.foreground,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* KEY APPLICATION METADATA */}
        <Card style={styles.metaCard}>
          <Text style={[styles.metaCardTitle, { color: colors.foreground }]}>
            Application Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Applied Date
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {application.applicationDate}
            </Text>
          </View>

          {application.salary ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Salary / Compensation
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {application.salary}
              </Text>
            </View>
          ) : null}

          {application.employmentType ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Employment Type
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {application.employmentType}
              </Text>
            </View>
          ) : null}

          {application.createdAt ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Created On
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {application.createdAt}
              </Text>
            </View>
          ) : null}

          {application.updatedAt ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Last Updated
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {application.updatedAt}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* INTERVIEW SCHEDULE IF PRESENT */}
        {application.interviewDate ? (
          <Card style={styles.metaCard}>
            <Text style={[styles.metaCardTitle, { color: colors.foreground }]}>
              Interview Schedule
            </Text>
            <BodyText style={{ color: colors.foreground, marginTop: 4 }}>
              📅 {application.interviewDate} {application.interviewTime ? `at ${application.interviewTime}` : ''}
            </BodyText>
            {application.interviewType ? (
              <BodyText style={{ color: colors.mutedForeground, marginTop: 2 }}>
                Type: {application.interviewType}
              </BodyText>
            ) : null}
            {application.meetingLink ? (
              <Button
                title="Launch Meeting Link →"
                size="sm"
                style={{ marginTop: Spacing.sm }}
                onPress={() => Linking.openURL(application.meetingLink!)}
              />
            ) : null}
          </Card>
        ) : null}

        {/* NOTES BODY */}
        {application.notes ? (
          <Card style={styles.metaCard}>
            <Text style={[styles.metaCardTitle, { color: colors.foreground }]}>
              Notes & Description
            </Text>
            <BodyText style={{ color: colors.foreground, lineHeight: 20, marginTop: 6 }}>
              {application.notes}
            </BodyText>
          </Card>
        ) : null}

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <Button
            title="Edit Application"
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            onPress={() => setIsEditOpen(true)}
          />
          <Button
            title="Delete"
            variant="danger"
            size="lg"
            style={{ flex: 1 }}
            onPress={handleDeletePrompt}
          />
        </View>

        {/* EDIT FORM MODAL */}
        <ApplicationForm
          visible={isEditOpen}
          initialData={application}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  backRow: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.xs + 2,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: TypographyTokens.sizes.xs + 1,
  },
  metaCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metaCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: TypographyTokens.sizes.sm,
  },
  infoValue: {
    fontSize: TypographyTokens.sizes.sm,
    fontWeight: TypographyTokens.weights.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
})
