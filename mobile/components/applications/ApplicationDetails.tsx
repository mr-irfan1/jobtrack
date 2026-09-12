import React from 'react'
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { BodyText, Heading, Subheading } from '../ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { ApplicationStatus, JobApplication } from '../../types/application'

interface ApplicationDetailsProps {
  application: JobApplication | null
  visible: boolean
  onClose: () => void
  onEdit: (app: JobApplication) => void
  onDelete: (id: string) => void
  onStatusChange: (app: JobApplication, status: ApplicationStatus) => void
}

const ALL_STATUSES: ApplicationStatus[] = [
  'Wishlist',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

export function ApplicationDetails({
  application,
  visible,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationDetailsProps) {
  const { colors } = useTheme()

  if (!application) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Heading style={{ fontSize: 18 }}>Application Details</Heading>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* COMPANY & ROLE BANNER */}
          <Card style={styles.mainCard}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Heading style={{ fontSize: 22, color: colors.foreground }}>
                  {application.company}
                </Heading>
                <Subheading style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 2 }}>
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

            <BodyText style={{ marginTop: Spacing.xs, color: colors.mutedForeground }}>
              📅 Applied on {application.applicationDate}
            </BodyText>

            {application.jobUrl ? (
              <TouchableOpacity
                style={styles.urlLink}
                onPress={() => Linking.openURL(application.jobUrl!)}
              >
                <Text style={[styles.urlText, { color: colors.primary }]}>
                  🔗 View Original Job Posting →
                </Text>
              </TouchableOpacity>
            ) : null}
          </Card>

          {/* QUICK STATUS CHANGER */}
          <View style={styles.section}>
            <Subheading style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Update Status
            </Subheading>
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
                    onPress={() => onStatusChange(application, st)}
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

          {/* INTERVIEW SCHEDULE DETAILS IF PRESENT */}
          {application.interviewDate ? (
            <Card style={styles.interviewSection}>
              <Heading style={{ fontSize: 16, marginBottom: Spacing.xs }}>
                Scheduled Interview
              </Heading>
              <BodyText style={{ color: colors.foreground }}>
                📅 Date: {application.interviewDate} {application.interviewTime ? `at ${application.interviewTime}` : ''}
              </BodyText>
              {application.interviewType ? (
                <BodyText style={{ marginTop: 2, color: colors.mutedForeground }}>
                  Type: {application.interviewType}
                </BodyText>
              ) : null}

              {application.meetingLink ? (
                <Button
                  title="Join Meeting Link →"
                  size="sm"
                  style={{ marginTop: Spacing.sm }}
                  onPress={() => Linking.openURL(application.meetingLink!)}
                />
              ) : null}
            </Card>
          ) : null}

          {/* NOTES */}
          {application.notes ? (
            <Card style={styles.notesSection}>
              <Subheading style={{ fontSize: 14, marginBottom: Spacing.xs }}>
                Notes & Description
              </Subheading>
              <BodyText style={{ color: colors.foreground, lineHeight: 20 }}>
                {application.notes}
              </BodyText>
            </Card>
          ) : null}

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtonsRow}>
            <Button
              title="Edit Application"
              variant="outline"
              size="md"
              style={{ flex: 1 }}
              onPress={() => {
                onClose()
                onEdit(application)
              }}
            />
            <Button
              title="Delete"
              variant="danger"
              size="md"
              style={{ flex: 1 }}
              onPress={() => {
                onClose()
                onDelete(application.id)
              }}
            />
          </View>
        </ScrollView>
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
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  mainCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  urlLink: {
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
  },
  urlText: {
    fontSize: TypographyTokens.sizes.sm,
    fontWeight: TypographyTokens.weights.semibold,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  interviewSection: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  notesSection: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
})
