import { useRouter } from 'expo-router'
import React from 'react'
import {
  Linking,
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
import { Skeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { BodyText, Heading, Subheading } from '../../components/ui/Typography'
import { BorderRadius, Spacing } from '../../constants/theme'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useTheme } from '../../hooks/useTheme'

export default function MobileDashboardScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const {
    stats,
    recentApplications,
    upcomingInterviews,
    loading,
    refreshing,
    error,
    refresh,
  } = useDashboardData()

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Skeleton height={28} width="50%" style={{ marginBottom: Spacing.md }} />
          <View style={styles.gridContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} style={styles.statCard}>
                <Skeleton height={24} width={40} style={{ marginBottom: 6 }} />
                <Skeleton height={14} width={60} />
              </Card>
            ))}
          </View>
          <Card style={[styles.analyticsCard, { marginTop: Spacing.lg }]}>
            <Skeleton height={20} width="40%" style={{ marginBottom: Spacing.md }} />
            <Skeleton height={60} width="100%" />
          </Card>
          <Card style={[styles.interviewCard, { marginTop: Spacing.lg }]}>
            <Skeleton height={20} width="50%" style={{ marginBottom: Spacing.md }} />
            <Skeleton height={50} width="100%" style={{ marginBottom: Spacing.sm }} />
            <Skeleton height={50} width="100%" />
          </Card>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ERROR STATE */}
        {error ? (
          <View style={[styles.errorCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
            <Text style={[styles.errorTitle, { color: colors.danger }]}>
              Unable to sync metrics
            </Text>
            <Text style={[styles.errorSub, { color: colors.foreground }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.danger }]} onPress={refresh}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* METRICS STAT CARDS GRID */}
        <View style={styles.sectionHeader}>
          <Heading style={styles.sectionTitle}>Overview Metrics</Heading>
        </View>

        <View style={styles.gridContainer}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Apps</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.applied}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Applied</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.interview}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Interviews</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.offer}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Offers</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.rejected}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rejected</Text>
          </Card>
        </View>

        {/* PERFORMANCE & OVERVIEW STATS */}
        <Card style={styles.analyticsCard}>
          <Subheading style={styles.cardHeaderTitle}>Performance Rate</Subheading>
          <View style={styles.analyticsRow}>
            <View style={styles.metricColumn}>
              <Text style={[styles.metricPercent, { color: colors.primary }]}>
                {stats.responseRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                Response Rate
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricColumn}>
              <Text style={[styles.metricPercent, { color: colors.success }]}>
                {stats.offerRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                Offer Rate
              </Text>
            </View>
          </View>
        </Card>

        {/* UPCOMING INTERVIEWS */}
        <View style={styles.sectionHeader}>
          <Heading style={styles.sectionTitle}>Upcoming Interviews</Heading>
        </View>

        {upcomingInterviews.length === 0 ? (
          <Card style={styles.emptyCard}>
            <BodyText style={{ color: colors.mutedForeground, textAlign: 'center' }}>
              No upcoming interviews scheduled.
            </BodyText>
          </Card>
        ) : (
          upcomingInterviews.map((item) => (
            <Card key={item.id} style={styles.interviewCard}>
              <View style={styles.interviewHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.companyText, { color: colors.foreground }]}>
                    {item.company}
                  </Text>
                  <Text style={[styles.roleText, { color: colors.mutedForeground }]}>
                    {item.jobTitle}
                  </Text>
                </View>
                {item.interviewType ? (
                  <View style={[styles.typeBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.warning }]}>
                      {item.interviewType}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.interviewFooter}>
                <Text style={[styles.dateText, { color: colors.foreground }]}>
                  📅 {item.interviewDate} {item.interviewTime ? `at ${item.interviewTime}` : ''}
                </Text>
                {item.meetingLink ? (
                  <TouchableOpacity
                    style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(item.meetingLink!)}
                  >
                    <Text style={styles.joinBtnText}>Join →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          ))
        )}

        {/* RECENT APPLICATIONS */}
        <View style={styles.sectionHeader}>
          <Heading style={styles.sectionTitle}>Recent Applications</Heading>
          <TouchableOpacity onPress={() => router.push('/(app)/applications')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>View all →</Text>
          </TouchableOpacity>
        </View>

        {recentApplications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Heading style={{ fontSize: 16, textAlign: 'center', marginBottom: Spacing.xs }}>
              No Job Applications Yet
            </Heading>
            <BodyText style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: Spacing.md }}>
              Start tracking your applications to see analytics and pipeline metrics.
            </BodyText>
            <Button
              title="+ Add First Application"
              onPress={() => router.push('/(app)/applications')}
            />
          </Card>
        ) : (
          recentApplications.map((item) => (
            <Card key={item.id} style={styles.appCard}>
              <View style={styles.appRow}>
                <View style={styles.appInfo}>
                  <Text style={[styles.companyText, { color: colors.foreground }]}>
                    {item.company}
                  </Text>
                  <Text style={[styles.roleText, { color: colors.mutedForeground }]}>
                    {item.jobTitle}
                  </Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>
              <Text style={[styles.appDate, { color: colors.mutedForeground }]}>
                Applied on {item.applicationDate}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, fontSize: 14 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  errorCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  errorTitle: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  errorSub: { fontSize: 13, marginBottom: Spacing.sm },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 18 },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  analyticsCard: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeaderTitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricColumn: {
    alignItems: 'center',
  },
  metricPercent: {
    fontSize: 26,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 36,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interviewCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleText: {
    fontSize: 13,
    marginTop: 2,
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
  interviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  appCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  appDate: {
    fontSize: 11,
    marginTop: Spacing.sm,
  },
})
