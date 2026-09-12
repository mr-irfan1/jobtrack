import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ApplicationForm } from '../../components/applications/ApplicationForm'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Heading, Subheading } from '../../components/ui/Typography'
import { BorderRadius, Spacing } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import { addApplication } from '../../services/mobileApplicationRepository'
import {
  analyzeJobUrl,
  getSourceBrandName,
  type ExtractedJobData,
} from '../../services/mobileJobExtractorService'
import type { JobApplication } from '../../types/application'

export default function ShareImportScreen() {
  const { url: initialUrlParam } = useLocalSearchParams<{ url: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const [inputUrl, setInputUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [extractedJob, setExtractedJob] = useState<ExtractedJobData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Manual fallback form state
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)
  const [manualPrefill, setManualPrefill] = useState<JobApplication | null>(null)

  const handleAnalyze = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim()
    if (!trimmed) {
      setErrorMsg('Please enter a valid job URL.')
      return
    }

    setAnalyzing(true)
    setErrorMsg(null)
    setExtractedJob(null)

    try {
      const result = await analyzeJobUrl(trimmed)
      if (result.success && result.job) {
        setExtractedJob(result.job)
      } else {
        setErrorMsg(
          result.message ||
            "We couldn't read this job page. The website may block automated access.",
        )
      }
    } catch {
      setErrorMsg('An unexpected error occurred during extraction. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }, [])

  // Auto-analyze when opened via deep link / share intent with a url param
  useEffect(() => {
    if (initialUrlParam && typeof initialUrlParam === 'string') {
      setInputUrl(initialUrlParam)
      handleAnalyze(initialUrlParam)
    }
  }, [initialUrlParam, handleAnalyze])

  async function handleConfirmAdd() {
    if (!extractedJob) return

    setSaving(true)
    const newApp: JobApplication = {
      id: String(Date.now()),
      company: extractedJob.company || 'Company',
      jobTitle: extractedJob.title || 'Job Opportunity',
      location: extractedJob.location || '',
      jobUrl: extractedJob.jobUrl || inputUrl.trim(),
      applicationDate: new Date().toISOString().slice(0, 10),
      status: 'Applied',
      notes: extractedJob.description || '',
      salary: extractedJob.salary || undefined,
      employmentType: extractedJob.employmentType || undefined,
    }

    try {
      const created = await addApplication(newApp)
      Alert.alert(
        'Added to Tracker!',
        `${created.company} - ${created.jobTitle} has been saved to your job applications.`,
        [
          {
            text: 'View Application',
            onPress: () => router.replace(`/(app)/applications/${created.id}`),
          },
          {
            text: 'Go to Pipeline',
            onPress: () => router.replace('/(app)/pipeline'),
          },
        ],
      )
    } catch {
      Alert.alert('Error', 'Failed to save application to your tracker.')
    } finally {
      setSaving(false)
    }
  }

  function handleOpenManualForm() {
    const prefill: JobApplication = {
      id: String(Date.now()),
      jobUrl: inputUrl.trim(),
      company: extractedJob?.company || '',
      jobTitle: extractedJob?.title || '',
      location: extractedJob?.location || '',
      notes: extractedJob?.description || '',
      salary: extractedJob?.salary || undefined,
      employmentType: extractedJob?.employmentType || undefined,
      applicationDate: new Date().toISOString().slice(0, 10),
      status: 'Applied',
    }
    setManualPrefill(prefill)
    setIsManualFormOpen(true)
  }

  async function handleManualFormSubmit(app: JobApplication) {
    const created = await addApplication(app)
    setIsManualFormOpen(false)
    router.replace(`/(app)/applications/${created.id}`)
  }

  const sourceName = inputUrl.trim() ? getSourceBrandName(inputUrl.trim()) : 'Web'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* HEADER BACK NAVIGATION */}
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              ← Back to JobTrack
            </Text>
          </TouchableOpacity>

          <Card style={styles.headerCard}>
            <Heading style={{ fontSize: 20 }}>Share to JobTrack</Heading>
            <Subheading style={{ fontSize: 13, marginTop: 4 }}>
              Automatic job extraction via JobTrack Link Importer
            </Subheading>
          </Card>

          {/* URL INPUT FIELD */}
          <View style={styles.inputSection}>
            <Input
              label="Job URL"
              placeholder="https://company.com/careers/job..."
              value={inputUrl}
              onChangeText={(text) => {
                setInputUrl(text)
                if (errorMsg) setErrorMsg(null)
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Button
              title={analyzing ? 'Analyzing Job Details...' : 'Analyze Job'}
              size="lg"
              loading={analyzing}
              disabled={analyzing || !inputUrl.trim()}
              onPress={() => handleAnalyze(inputUrl)}
            />
          </View>

          {/* ANALYZING LOADING INDICATOR */}
          {analyzing ? (
            <View style={styles.analyzingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.mutedForeground }]}>
                Reading job details from {sourceName}...
              </Text>
            </View>
          ) : null}

          {/* EXTRACTION ERROR & FALLBACK */}
          {errorMsg ? (
            <View style={[styles.errorCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
              <Text style={[styles.errorHeading, { color: colors.danger }]}>
                Extraction Notice
              </Text>
              <Text style={[styles.errorMsg, { color: colors.foreground }]}>
                {errorMsg}
              </Text>
              <View style={styles.errorBtnRow}>
                <Button
                  title="Retry"
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={() => handleAnalyze(inputUrl)}
                />
                <Button
                  title="Enter Manually →"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={handleOpenManualForm}
                />
              </View>
            </View>
          ) : null}

          {/* EXTRACTED PREVIEW CARD */}
          {extractedJob ? (
            <Card style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewCompany, { color: colors.foreground }]}>
                    {extractedJob.company || 'Company'}
                  </Text>
                  <Heading style={{ fontSize: 18, marginTop: 2 }}>
                    {extractedJob.title || 'Job Title'}
                  </Heading>
                </View>
                <View style={[styles.sourceBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.sourceBadgeText, { color: colors.primary }]}>
                    {extractedJob.source || sourceName}
                  </Text>
                </View>
              </View>

              {extractedJob.location ? (
                <Text style={[styles.previewMeta, { color: colors.mutedForeground }]}>
                  📍 {extractedJob.location}
                </Text>
              ) : null}

              {extractedJob.employmentType ? (
                <Text style={[styles.previewMeta, { color: colors.mutedForeground }]}>
                  💼 {extractedJob.employmentType}
                </Text>
              ) : null}

              {extractedJob.salary ? (
                <Text style={[styles.previewMeta, { color: colors.mutedForeground }]}>
                  💰 {extractedJob.salary}
                </Text>
              ) : null}

              {extractedJob.description ? (
                <View style={[styles.descContainer, { borderTopColor: colors.border }]}>
                  <Subheading style={{ fontSize: 13, marginBottom: 4 }}>
                    Job Summary
                  </Subheading>
                  <Text
                    numberOfLines={5}
                    style={[styles.descText, { color: colors.mutedForeground }]}
                  >
                    {extractedJob.description}
                  </Text>
                </View>
              ) : null}

              <View style={styles.previewActions}>
                <Button
                  title="Edit Details"
                  variant="outline"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={handleOpenManualForm}
                />
                <Button
                  title="Add to Tracker ✓"
                  size="md"
                  loading={saving}
                  style={{ flex: 1 }}
                  onPress={handleConfirmAdd}
                />
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MANUAL FALLBACK FORM */}
      <ApplicationForm
        visible={isManualFormOpen}
        initialData={manualPrefill}
        onClose={() => setIsManualFormOpen(false)}
        onSubmit={handleManualFormSubmit}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  analyzingBox: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  analyzingText: {
    marginTop: Spacing.sm,
    fontSize: 13,
  },
  errorCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  errorHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorMsg: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  errorBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  previewCompany: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  descContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
})
