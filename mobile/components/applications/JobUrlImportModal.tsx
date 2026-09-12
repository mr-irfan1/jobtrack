import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { BodyText, Heading, Subheading } from '../ui/Typography'
import { BorderRadius, Spacing } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import {
  analyzeJobUrl,
  getSourceBrandName,
  type ExtractedJobData,
} from '../../services/mobileJobExtractorService'
import type { JobApplication } from '../../types/application'

interface JobUrlImportModalProps {
  visible: boolean
  onClose: () => void
  onConfirmAdd: (app: JobApplication) => Promise<void>
  onManualFallback: (prefillData: Partial<JobApplication>) => void
}

export function JobUrlImportModal({
  visible,
  onClose,
  onConfirmAdd,
  onManualFallback,
}: JobUrlImportModalProps) {
  const { colors } = useTheme()

  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [extractedJob, setExtractedJob] = useState<ExtractedJobData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function resetState() {
    setUrl('')
    setExtractedJob(null)
    setErrorMsg(null)
    setAnalyzing(false)
    setSaving(false)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  async function handleAnalyze() {
    if (!url.trim()) {
      setErrorMsg('Please enter a valid job URL.')
      return
    }

    setAnalyzing(true)
    setErrorMsg(null)
    setExtractedJob(null)

    try {
      const result = await analyzeJobUrl(url.trim())
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
  }

  async function handleConfirmAdd() {
    if (!extractedJob) return

    setSaving(true)
    const newApp: JobApplication = {
      id: String(Date.now()),
      company: extractedJob.company || 'Unknown Company',
      jobTitle: extractedJob.title || 'Job Opportunity',
      location: extractedJob.location || '',
      jobUrl: extractedJob.jobUrl || url.trim(),
      applicationDate: new Date().toISOString().slice(0, 10),
      status: 'Applied',
      notes: extractedJob.description || '',
      salary: extractedJob.salary || undefined,
      employmentType: extractedJob.employmentType || undefined,
    }

    try {
      await onConfirmAdd(newApp)
      handleClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function handleSwitchToManual() {
    const prefill: Partial<JobApplication> = {
      jobUrl: url.trim(),
      company: extractedJob?.company || '',
      jobTitle: extractedJob?.title || '',
      location: extractedJob?.location || '',
      notes: extractedJob?.description || '',
      salary: extractedJob?.salary || undefined,
      employmentType: extractedJob?.employmentType || undefined,
      applicationDate: new Date().toISOString().slice(0, 10),
      status: 'Applied',
    }
    handleClose()
    onManualFallback(prefill)
  }

  const sourceName = url.trim() ? getSourceBrandName(url.trim()) : 'Web'

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Heading style={{ fontSize: 18 }}>Import Job from URL</Heading>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* INSTRUCTION CARD */}
            <Card style={styles.introCard}>
              <Text style={[styles.introTitle, { color: colors.foreground }]}>
                Automatic Job Tracker
              </Text>
              <BodyText style={{ color: colors.mutedForeground, marginTop: 4 }}>
                Paste a public job posting URL (e.g. Amazon Jobs, LinkedIn, Unstop, Indeed, Greenhouse, Lever, or company career pages) to automatically extract job details.
              </BodyText>
            </Card>

            {/* URL INPUT & ACTION */}
            <View style={styles.inputSection}>
              <Input
                label="Job Posting URL"
                placeholder="https://company.com/careers/job..."
                value={url}
                onChangeText={(text) => {
                  setUrl(text)
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
                disabled={analyzing || !url.trim()}
                onPress={handleAnalyze}
              />
            </View>

            {/* LOADING STATE */}
            {analyzing ? (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.analyzingText, { color: colors.mutedForeground }]}>
                  Reading job posting from {sourceName}...
                </Text>
              </View>
            ) : null}

            {/* ERROR STATE & MANUAL FALLBACK */}
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
                    onPress={handleAnalyze}
                  />
                  <Button
                    title="Enter Manually →"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={handleSwitchToManual}
                  />
                </View>
              </View>
            ) : null}

            {/* JOB PREVIEW STATE */}
            {extractedJob ? (
              <Card style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.previewCompany, { color: colors.foreground }]}>
                      {extractedJob.company || 'Company Name'}
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
                    title="Edit in Form"
                    variant="outline"
                    size="md"
                    style={{ flex: 1 }}
                    onPress={handleSwitchToManual}
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
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 20, fontWeight: '600' },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  introCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '700',
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
