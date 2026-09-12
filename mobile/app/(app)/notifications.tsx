import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Heading, Subheading } from '../../components/ui/Typography'
import { BorderRadius, Spacing, TypographyTokens } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import { getApplications } from '../../services/mobileApplicationRepository'
import {
  buildMobileNotifications,
  getReadNotificationIds,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type MobileNotification,
} from '../../services/mobileNotificationService'
import type { JobApplication } from '../../types/application'

export default function MobileNotificationsScreen() {
  const { colors } = useTheme()
  const router = useRouter()

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Notification Detail Modal State
  const [selectedNotification, setSelectedNotification] =
    useState<MobileNotification | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadNotificationsData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true)
    else setLoading(true)

    setError(null)
    try {
      const [apps, reads] = await Promise.all([
        getApplications(),
        getReadNotificationIds(),
      ])
      setApplications(apps)
      setReadIds(reads)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load notifications. Pull down to refresh.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadNotificationsData()
  }, [loadNotificationsData])

  const notifications = useMemo(() => {
    return buildMobileNotifications(applications, readIds)
  }, [applications, readIds])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  // MARK SINGLE NOTIFICATION READ
  async function handleNotificationPress(notification: MobileNotification) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
      setReadIds((prev) => new Set([...prev, notification.id]))
    }
    setSelectedNotification(notification)
    setIsDetailOpen(true)
  }

  // MARK ALL AS READ
  async function handleMarkAllAsRead() {
    const allIds = notifications.map((n) => n.id)
    await markAllNotificationsAsRead(allIds)
    setReadIds(new Set(allIds))
  }

  function getCategoryEmoji(category: MobileNotification['category']): string {
    switch (category) {
      case 'TODAY_INTERVIEW':
        return '🚨'
      case 'UPCOMING_INTERVIEW':
        return '📅'
      case 'STATUS_CHANGE':
        return '✨'
      case 'APPLICATION_UPDATE':
        return '📝'
      case 'SYSTEM_WELCOME':
        return '👋'
      default:
        return '🔔'
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER ACTIONS BAR */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Heading style={{ fontSize: 18 }}>Notifications</Heading>
          {unreadCount > 0 ? (
            <View style={[styles.unreadBadgePill, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgePillText}>{unreadCount} unread</Text>
            </View>
          ) : null}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ERROR STATE */}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Button title="Retry" size="sm" onPress={() => loadNotificationsData()} />
        </View>
      ) : null}

      {/* MAIN NOTIFICATIONS LIST */}
      {loading && !refreshing ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={{ padding: Spacing.md, marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 }}>
                <Skeleton height={20} width={20} borderRadius={10} />
                <Skeleton height={16} width="60%" />
              </View>
              <Skeleton height={13} width="85%" style={{ marginLeft: 28 }} />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList<MobileNotification>
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotificationsData(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const emoji = getCategoryEmoji(item.category)
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(item)}
              >
                <Card
                  style={[
                    styles.notificationCard,
                    !item.read && {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      <Text style={styles.emojiText}>{emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.notifTitle,
                            {
                              color: colors.foreground,
                              fontWeight: item.read ? '600' : '700',
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.notifMeta, { color: colors.mutedForeground }]}>
                          {item.meta}
                        </Text>
                      </View>
                    </View>
                    {!item.read ? (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    ) : null}
                  </View>
                </Card>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Heading style={{ fontSize: 16, textAlign: 'center', marginBottom: Spacing.xs }}>
                No Notifications
              </Heading>
              <Subheading style={{ textAlign: 'center' }}>
                You are all caught up! New application and interview updates will appear here.
              </Subheading>
            </Card>
          }
        />
      )}

      {/* NOTIFICATION DETAIL MODAL */}
      {selectedNotification ? (
        <Modal
          visible={isDetailOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsDetailOpen(false)}
        >
          <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Heading style={{ fontSize: 18 }}>Notification Detail</Heading>
              <TouchableOpacity onPress={() => setIsDetailOpen(false)}>
                <Text style={{ fontSize: 20, color: colors.mutedForeground }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Card style={styles.detailCard}>
                <Text style={styles.modalEmoji}>
                  {getCategoryEmoji(selectedNotification.category)}
                </Text>
                <Heading style={{ fontSize: 20, textAlign: 'center', marginBottom: Spacing.xs }}>
                  {selectedNotification.title}
                </Heading>
                <Text style={[styles.modalMeta, { color: colors.mutedForeground, textAlign: 'center' }]}>
                  {selectedNotification.meta}
                </Text>

                {selectedNotification.description ? (
                  <View style={[styles.descBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.descText, { color: colors.foreground }]}>
                      {selectedNotification.description}
                    </Text>
                  </View>
                ) : null}

                {/* MEETING LINK LAUNCHER IF AVAILABLE */}
                {selectedNotification.meetingLink ? (
                  <Button
                    title="Join Scheduled Meeting 🔗"
                    style={{ marginTop: Spacing.md }}
                    onPress={() => Linking.openURL(selectedNotification.meetingLink!)}
                  />
                ) : null}

                {/* VIEW APPLICATION LINK */}
                {selectedNotification.applicationId ? (
                  <Button
                    title="View Job Application Details →"
                    variant="outline"
                    style={{ marginTop: Spacing.md }}
                    onPress={() => {
                      setIsDetailOpen(false)
                      router.push(`/(app)/applications/${selectedNotification.applicationId}`)
                    }}
                  />
                ) : null}
              </Card>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  unreadBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  unreadBadgePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  notificationCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  emojiText: {
    fontSize: 20,
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  notifTitle: {
    fontSize: TypographyTokens.sizes.sm,
  },
  notifMeta: {
    fontSize: TypographyTokens.sizes.xs,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  detailCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  modalMeta: {
    fontSize: TypographyTokens.sizes.sm,
    marginBottom: Spacing.lg,
  },
  descBox: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  descText: {
    fontSize: TypographyTokens.sizes.sm,
    lineHeight: 20,
  },
})
