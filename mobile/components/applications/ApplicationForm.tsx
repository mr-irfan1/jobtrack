import React, { useEffect, useState } from 'react'
import {
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
import { Input } from '../ui/Input'
import { Heading } from '../ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { ApplicationStatus, JobApplication } from '../../types/application'

interface ApplicationFormProps {
  visible: boolean
  initialData?: JobApplication | null
  onClose: () => void
  onSubmit: (app: JobApplication) => Promise<void>
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Wishlist',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

export function ApplicationForm({
  visible,
  initialData,
  onClose,
  onSubmit,
}: ApplicationFormProps) {
  const { colors } = useTheme()

  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [applicationDate, setApplicationDate] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('Applied')
  const [notes, setNotes] = useState('')
  const [salary, setSalary] = useState('')
  const [employmentType, setEmploymentType] = useState('')

  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [meetingLink, setMeetingLink] = useState('')

  const [errors, setErrors] = useState<{ company?: string; jobTitle?: string }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || '')
      setJobTitle(initialData.jobTitle || '')
      setLocation(initialData.location || '')
      setJobUrl(initialData.jobUrl || '')
      setApplicationDate(
        initialData.applicationDate || new Date().toISOString().slice(0, 10),
      )
      setStatus(initialData.status || 'Applied')
      setNotes(initialData.notes || '')
      setSalary(initialData.salary || '')
      setEmploymentType(initialData.employmentType || '')
      setInterviewDate(initialData.interviewDate || '')
      setInterviewTime(initialData.interviewTime || '')
      setInterviewType(initialData.interviewType || '')
      setMeetingLink(initialData.meetingLink || '')
    } else {
      setCompany('')
      setJobTitle('')
      setLocation('')
      setJobUrl('')
      setApplicationDate(new Date().toISOString().slice(0, 10))
      setStatus('Applied')
      setNotes('')
      setSalary('')
      setEmploymentType('')
      setInterviewDate('')
      setInterviewTime('')
      setInterviewType('')
      setMeetingLink('')
    }
    setErrors({})
  }, [initialData, visible])

  async function handleSave() {
    const errs: { company?: string; jobTitle?: string } = {}
    if (!company.trim()) errs.company = 'Company name is required.'
    if (!jobTitle.trim()) errs.jobTitle = 'Job title is required.'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)

    const payload: JobApplication = {
      id: initialData ? initialData.id : String(Date.now()),
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      location: location.trim(),
      jobUrl: jobUrl.trim(),
      applicationDate: applicationDate.trim() || new Date().toISOString().slice(0, 10),
      status,
      notes: notes.trim(),
      salary: salary.trim() || undefined,
      employmentType: employmentType.trim() || undefined,
      interviewDate: interviewDate.trim() || undefined,
      interviewTime: interviewTime.trim() || undefined,
      interviewType: interviewType.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Heading style={{ fontSize: 18 }}>
            {initialData ? 'Edit Application' : 'Add New Application'}
          </Heading>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
            <Input
              label="Company Name *"
              placeholder="e.g. Acme Corp"
              value={company}
              onChangeText={setCompany}
              error={errors.company}
            />

            <Input
              label="Job Title *"
              placeholder="e.g. Senior Software Engineer"
              value={jobTitle}
              onChangeText={setJobTitle}
              error={errors.jobTitle}
            />

            <Input
              label="Location"
              placeholder="e.g. Remote, San Francisco, CA"
              value={location}
              onChangeText={setLocation}
            />

            <Input
              label="Salary / Compensation"
              placeholder="e.g. $120,000 - $140,000"
              value={salary}
              onChangeText={setSalary}
            />

            <Input
              label="Employment Type"
              placeholder="e.g. Full-time, Contract, Internship"
              value={employmentType}
              onChangeText={setEmploymentType}
            />

            <Input
              label="Job Posting URL"
              placeholder="https://company.com/careers/job"
              value={jobUrl}
              onChangeText={setJobUrl}
              autoCapitalize="none"
            />

            <Input
              label="Application Date"
              placeholder="YYYY-MM-DD"
              value={applicationDate}
              onChangeText={setApplicationDate}
            />

            {/* STATUS PICKER CHIPS */}
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Application Status
            </Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((st) => {
                const isSelected = status === st
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setStatus(st)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : colors.foreground },
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Input
              label="Notes / Job Description"
              placeholder="Key requirements, referral info, salary notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ height: 80 }}
            />

            {/* OPTIONAL INTERVIEW DETAILS */}
            <Text style={[styles.sectionHeading, { color: colors.mutedForeground }]}>
              INTERVIEW DETAILS (OPTIONAL)
            </Text>

            <Input
              label="Interview Date"
              placeholder="YYYY-MM-DD"
              value={interviewDate}
              onChangeText={setInterviewDate}
            />

            <Input
              label="Interview Time"
              placeholder="HH:MM (e.g. 14:30)"
              value={interviewTime}
              onChangeText={setInterviewTime}
            />

            <Input
              label="Round / Type"
              placeholder="e.g. Technical Screen, System Design"
              value={interviewType}
              onChangeText={setInterviewType}
            />

            <Input
              label="Meeting Link"
              placeholder="https://zoom.us/j/..."
              value={meetingLink}
              onChangeText={setMeetingLink}
              autoCapitalize="none"
            />

            <View style={styles.formActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="lg"
                style={{ flex: 1 }}
                onPress={onClose}
              />
              <Button
                title={initialData ? 'Update Application' : 'Save Application'}
                size="lg"
                style={{ flex: 1 }}
                loading={loading}
                onPress={handleSave}
              />
            </View>
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
  fieldLabel: {
    fontSize: TypographyTokens.sizes.sm,
    fontWeight: TypographyTokens.weights.medium,
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  statusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: TypographyTokens.sizes.xs + 1,
    fontWeight: TypographyTokens.weights.semibold,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
})
