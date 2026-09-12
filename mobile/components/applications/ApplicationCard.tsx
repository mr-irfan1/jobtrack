import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { JobApplication } from '../../types/application'

interface ApplicationCardProps {
  application: JobApplication
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}

export const ApplicationCard = React.memo(function ApplicationCard({
  application,
  onPress,
  onEdit,
  onDelete,
}: ApplicationCardProps) {
  const { colors } = useTheme()

  const firstLetter = (application.company || 'J').charAt(0).toUpperCase()

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${application.company}, ${application.jobTitle}, status ${application.status}`}
        accessibilityHint="Opens application details"
      >
        <View style={styles.cardHeader}>
          <View style={styles.companyRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {firstLetter}
              </Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: colors.foreground }]}>
                {application.company}
              </Text>
              <Text style={[styles.jobTitle, { color: colors.mutedForeground }]}>
                {application.jobTitle}
              </Text>
            </View>
          </View>
          <StatusBadge status={application.status} size="sm" />
        </View>

        {application.location ? (
          <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
            📍 {application.location}
          </Text>
        ) : null}

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            Applied {application.applicationDate}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${application.company} application`}
            >
              <Text style={[styles.editActionText, { color: colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${application.company} application`}
            >
              <Text style={[styles.deleteActionText, { color: colors.danger }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  )
})

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: TypographyTokens.weights.bold,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: TypographyTokens.sizes.base,
    fontWeight: TypographyTokens.weights.bold,
  },
  jobTitle: {
    fontSize: TypographyTokens.sizes.sm,
    marginTop: 2,
  },
  locationText: {
    fontSize: TypographyTokens.sizes.xs,
    marginTop: Spacing.xs + 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: TypographyTokens.sizes.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  editActionText: {
    fontSize: TypographyTokens.sizes.xs,
    fontWeight: TypographyTokens.weights.semibold,
  },
  deleteActionText: {
    fontSize: TypographyTokens.sizes.xs,
    fontWeight: TypographyTokens.weights.semibold,
  },
})
