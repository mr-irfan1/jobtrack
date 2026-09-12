import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { BodyText, Heading, Subheading } from '../../components/ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import {
  getApplications,
  updateApplication,
} from '../../services/mobileApplicationRepository'
import { scheduleInterviewReminders } from '../../services/mobilePushNotificationService'
import type { JobApplication } from '../../types/application'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function MobileInterviewsScreen() {
  const { colors } = useTheme()

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    return new Date().toISOString().slice(0, 10)
  })

  // Interview Schedule / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)

  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formType, setFormType] = useState('')
  const [formMeetingLink, setFormMeetingLink] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formErrors, setFormErrors] = useState<{ date?: string }>({})
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async (isPullToRefresh = false) => {
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
          : 'Failed to load interviews. Pull down to refresh.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ALL SCHEDULED INTERVIEWS
  const scheduledInterviews = useMemo(() => {
    return applications
      .filter((app) => Boolean(app.interviewDate))
      .sort((a, b) => {
        const dateA = `${a.interviewDate} ${a.interviewTime || '00:00'}`
        const dateB = `${b.interviewDate} ${b.interviewTime || '00:00'}`
        return dateA.localeCompare(dateB)
      })
  }, [applications])

  // DATES WITH INTERVIEWS MAP
  const interviewDatesSet = useMemo(() => {
    const set = new Set<string>()
    scheduledInterviews.forEach((item) => {
      if (item.interviewDate) {
        set.add(item.interviewDate)
      }
    })
    return set
  }, [scheduledInterviews])

  // FILTERED INTERVIEWS FOR SELECTED DATE
  const selectedDateInterviews = useMemo(() => {
    if (!selectedDateStr) return scheduledInterviews
    return scheduledInterviews.filter(
      (item) => item.interviewDate === selectedDateStr,
    )
  }, [scheduledInterviews, selectedDateStr])

  // CALENDAR GRID COMPUTATION
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: { dayNumber: number | null; dateStr: string | null }[] = []

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      days.push({
        dayNumber: d,
        dateStr: `${year}-${monthStr}-${dayStr}`,
      })
    }

    return days
  }, [currentMonth])

  // MONTH NAVIGATION
  function handlePrevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    )
  }

  function handleNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    )
  }

  function handleToday() {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDateStr(today.toISOString().slice(0, 10))
  }

  // OPEN EDIT FORM
  function handleOpenEdit(app: JobApplication) {
    setEditingApp(app)
    setFormDate(app.interviewDate || new Date().toISOString().slice(0, 10))
    setFormTime(app.interviewTime || '10:00')
    setFormType(app.interviewType || 'Technical Screen')
    setFormMeetingLink(app.meetingLink || '')
    setFormNotes(app.notes || '')
    setFormErrors({})
    setIsFormOpen(true)
  }

  // OPEN NEW INTERVIEW FORM
  function handleOpenNew() {
    if (applications.length === 0) {
      Alert.alert(
        'No Applications Available',
        'Please add a job application first before scheduling an interview.',
      )
      return
    }
    const defaultApp = applications[0]
    setEditingApp(defaultApp)
    setFormDate(selectedDateStr || new Date().toISOString().slice(0, 10))
    setFormTime('10:00')
    setFormType('Technical Screen')
    setFormMeetingLink('')
    setFormNotes(defaultApp.notes || '')
    setFormErrors({})
    setIsFormOpen(true)
  }

  // SAVE INTERVIEW SCHEDULE
  async function handleSaveInterview() {
    if (!formDate.trim()) {
      setFormErrors({ date: 'Interview date is required (YYYY-MM-DD).' })
      return
    }
    if (!editingApp) return

    setSaving(true)
    const updatedApp: JobApplication = {
      ...editingApp,
      status: 'Interview',
      interviewDate: formDate.trim(),
      interviewTime: formTime.trim() || undefined,
      interviewType: formType.trim() || undefined,
      meetingLink: formMeetingLink.trim() || undefined,
      notes: formNotes.trim() || editingApp.notes,
    }

    try {
      const saved = await updateApplication(updatedApp)
      setApplications((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item)),
      )
      setIsFormOpen(false)
      setSelectedDateStr(saved.interviewDate || null)
      // Schedule native push reminders (24h and 1h prior)
      scheduleInterviewReminders(saved).catch(() => {})
    } catch {
      Alert.alert('Error', 'Failed to save interview schedule.')
    } finally {
      setSaving(false)
    }
  }

  // CANCEL / DELETE INTERVIEW SCHEDULE
  function handleDeleteInterview(app: JobApplication) {
    Alert.alert(
      'Cancel Interview Schedule',
      `Are you sure you want to remove the scheduled interview with ${app.company}?`,
      [
        { text: 'Keep Interview', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const clearedApp: JobApplication = {
              ...app,
              interviewDate: undefined,
              interviewTime: undefined,
              interviewType: undefined,
              meetingLink: undefined,
            }
            try {
              const saved = await updateApplication(clearedApp)
              setApplications((prev) =>
                prev.map((item) => (item.id === saved.id ? saved : item)),
              )
            } catch {
              Alert.alert('Error', 'Failed to remove interview schedule.')
            }
          },
        },
      ],
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* HEADER ACTIONS */}
        <View style={styles.headerRow}>
          <Heading style={{ fontSize: 20 }}>Interview Calendar</Heading>
          <TouchableOpacity
            style={[styles.scheduleBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenNew}
          >
            <Text style={styles.scheduleBtnText}>+ Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* ERROR STATE */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <Button title="Retry" size="sm" onPress={() => loadData()} />
          </View>
        ) : null}

        {/* MONTHLY CALENDAR CARD */}
        <Card style={styles.calendarCard}>
          {/* MONTH NAVIGATION BAR */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
              <Text style={[styles.navArrowText, { color: colors.foreground }]}>‹</Text>
            </TouchableOpacity>

            <View style={styles.monthTitleBox}>
              <Text style={[styles.monthTitleText, { color: colors.foreground }]}>
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleToday}>
                <Text style={[styles.todayLink, { color: colors.primary }]}>Today</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
              <Text style={[styles.navArrowText, { color: colors.foreground }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* WEEKDAY LABELS */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((wd) => (
              <Text key={wd} style={[styles.weekdayLabel, { color: colors.mutedForeground }]}>
                {wd}
              </Text>
            ))}
          </View>

          {/* DAYS GRID */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              if (!item.dayNumber || !item.dateStr) {
                return <View key={`empty-${index}`} style={styles.dayCell} />
              }

              const isSelected = selectedDateStr === item.dateStr
              const isToday = todayStr === item.dateStr
              const hasInterview = interviewDatesSet.has(item.dateStr)

              return (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: colors.primary,
                      borderRadius: BorderRadius.full,
                    },
                  ]}
                  onPress={() => setSelectedDateStr(item.dateStr)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                            ? colors.primary
                            : colors.foreground,
                        fontWeight: isSelected || isToday ? '700' : '400',
                      },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>
                  {hasInterview ? (
                    <View
                      style={[
                        styles.dotIndicator,
                        {
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : colors.warning,
                        },
                      ]}
                    />
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </View>
        </Card>

        {/* SELECTED DATE BANNER */}
        <View style={styles.filterBanner}>
          <View style={{ flex: 1 }}>
            <Heading style={{ fontSize: 16 }}>
              {selectedDateStr ? `Interviews on ${selectedDateStr}` : 'All Scheduled Interviews'}
            </Heading>
            <Subheading style={{ fontSize: 12, marginTop: 2 }}>
              {selectedDateInterviews.length} interview{selectedDateInterviews.length === 1 ? '' : 's'} found
            </Subheading>
          </View>
          {selectedDateStr ? (
            <TouchableOpacity onPress={() => setSelectedDateStr(null)}>
              <Text style={[styles.showAllLink, { color: colors.primary }]}>Show All →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* SCHEDULED INTERVIEWS LIST */}
        {loading && !refreshing ? (
          <View style={{ marginTop: Spacing.sm }}>
            {[1, 2].map((i) => (
              <Card key={i} style={{ padding: Spacing.lg, marginBottom: Spacing.md }}>
                <Skeleton height={18} width="50%" style={{ marginBottom: Spacing.sm }} />
                <Skeleton height={14} width="70%" style={{ marginBottom: Spacing.sm }} />
                <Skeleton height={12} width="40%" />
              </Card>
            ))}
          </View>
        ) : selectedDateInterviews.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Heading style={{ fontSize: 15, textAlign: 'center', marginBottom: Spacing.xs }}>
              No Interviews Scheduled
            </Heading>
            <BodyText style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: Spacing.md }}>
              {selectedDateStr
                ? `No interviews are scheduled for ${selectedDateStr}.`
                : 'You have no scheduled upcoming interviews.'}
            </BodyText>
            <Button title="+ Schedule Interview" onPress={handleOpenNew} />
          </Card>
        ) : (
          selectedDateInterviews.map((item) => (
            <Card key={item.id} style={styles.interviewCard}>
              <View style={styles.interviewCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardCompany, { color: colors.foreground }]}>
                    {item.company}
                  </Text>
                  <Text style={[styles.cardRole, { color: colors.mutedForeground }]}>
                    {item.jobTitle}
                  </Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              <View style={styles.interviewDetailsRow}>
                <Text style={[styles.timeText, { color: colors.foreground }]}>
                  ⏰ {item.interviewDate} {item.interviewTime ? `at ${item.interviewTime}` : ''}
                </Text>
                {item.interviewType ? (
                  <View style={[styles.typeBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.warning }]}>
                      {item.interviewType}
                    </Text>
                  </View>
                ) : null}
              </View>

              {item.notes ? (
                <Text style={[styles.notesText, { color: colors.mutedForeground }]}>
                  Notes: {item.notes}
                </Text>
              ) : null}

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                {item.meetingLink ? (
                  <TouchableOpacity
                    style={[styles.meetingBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(item.meetingLink!)}
                  >
                    <Text style={styles.meetingBtnText}>Join Meeting 🔗</Text>
                  </TouchableOpacity>
                ) : <View />}

                <View style={styles.footerActions}>
                  <TouchableOpacity
                    style={styles.footerActionBtn}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.footerActionBtn}
                    onPress={() => handleDeleteInterview(item)}
                  >
                    <Text style={[styles.actionText, { color: colors.danger }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* SCHEDULE / EDIT INTERVIEW MODAL */}
      <Modal visible={isFormOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsFormOpen(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Heading style={{ fontSize: 18 }}>Schedule Interview</Heading>
            <TouchableOpacity onPress={() => setIsFormOpen(false)}>
              <Text style={{ fontSize: 20, color: colors.mutedForeground }}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* APPLICATION SELECTOR */}
              <Text style={[styles.modalFieldLabel, { color: colors.foreground }]}>
                Select Application
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                {applications.map((app) => {
                  const isSelected = editingApp?.id === app.id
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={[
                        styles.appSelectChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setEditingApp(app)
                      }}
                    >
                      <Text
                        style={[
                          styles.appSelectChipText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.foreground,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {app.company} - {app.jobTitle}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <Input
                label="Interview Date *"
                placeholder="YYYY-MM-DD"
                value={formDate}
                onChangeText={setFormDate}
                error={formErrors.date}
              />

              <Input
                label="Interview Time"
                placeholder="HH:MM (e.g. 14:00)"
                value={formTime}
                onChangeText={setFormTime}
              />

              <Input
                label="Interview Round / Type"
                placeholder="e.g. Screening, Technical, System Design"
                value={formType}
                onChangeText={setFormType}
              />

              <Input
                label="Meeting URL"
                placeholder="https://meet.google.com/... or https://zoom.us/..."
                value={formMeetingLink}
                onChangeText={setFormMeetingLink}
                autoCapitalize="none"
              />

              <Input
                label="Preparation Notes"
                placeholder="Key talking points, interviewer name, questions..."
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                style={{ height: 70 }}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="lg"
                  style={{ flex: 1 }}
                  onPress={() => setIsFormOpen(false)}
                />
                <Button
                  title="Save Interview"
                  size="lg"
                  style={{ flex: 1 }}
                  loading={saving}
                  onPress={handleSaveInterview}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scheduleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  scheduleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  calendarCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  navArrowBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  navArrowText: {
    fontSize: 26,
    fontWeight: '600',
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  todayLink: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs,
  },
  weekdayLabel: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 13,
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  showAllLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interviewCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  interviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardCompany: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardRole: {
    fontSize: 13,
    marginTop: 2,
  },
  interviewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.xs + 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  meetingBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  meetingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
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
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalScroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  modalFieldLabel: {
    fontSize: TypographyTokens.sizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  appSelectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  appSelectChipText: {
    fontSize: TypographyTokens.sizes.xs + 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
})
