import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import type { JobApplication } from '../types/application'

// Configure Foreground Notification Presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
})

export interface PushTokenResult {
  token: string | null
  granted: boolean
  error?: string
}

/**
 * Request notification permissions and register for push notifications.
 */
export async function registerForPushNotificationsAsync(): Promise<PushTokenResult> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('jobtrack-alerts', {
      name: 'JobTrack Interview & Status Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    })
  }

  if (!Device.isDevice) {
    return {
      token: null,
      granted: false,
      error: 'Must use physical device for remote push notifications.',
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return {
      token: null,
      granted: false,
      error: 'Notification permission was denied by user.',
    }
  }

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync()
    const token = pushTokenData.data

    // Safely save push token to authenticated user's metadata in Supabase
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        await supabase.auth.updateUser({
          data: {
            ...sessionData.session.user.user_metadata,
            push_token: token,
            push_token_updated_at: new Date().toISOString(),
          },
        })
      }
    } catch {
      // Non-blocking metadata sync
    }

    return {
      token,
      granted: true,
    }
  } catch (err: unknown) {
    return {
      token: null,
      granted: true,
      error: err instanceof Error ? err.message : 'Failed to retrieve push token.',
    }
  }
}

/**
 * Schedule native interview reminders for an application:
 * - 24 hours prior: "Interview tomorrow at {time}"
 * - 1 hour prior: "Interview starting in 1 hour"
 */
export async function scheduleInterviewReminders(
  application: JobApplication,
): Promise<void> {
  if (!application.interviewDate) return

  // Check if notifications are enabled in user preferences
  try {
    const { data } = await supabase.auth.getSession()
    const prefs = data.session?.user.user_metadata?.preferences
    if (prefs && prefs.emailNotifications === false) {
      return
    }
  } catch {
    // Continue
  }

  const timeStr = application.interviewTime || '09:00'
  const interviewDateTimeStr = `${application.interviewDate}T${timeStr}:00`
  const interviewTimeMs = new Date(interviewDateTimeStr).getTime()
  const nowMs = Date.now()

  // 1. Reminder: 24 Hours Prior
  const oneDayBeforeMs = interviewTimeMs - 24 * 60 * 60 * 1000
  if (oneDayBeforeMs > nowMs) {
    const secondsUntil = Math.floor((oneDayBeforeMs - nowMs) / 1000)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Interview Tomorrow: ${application.company}`,
        body: `Your interview for ${application.jobTitle} is scheduled tomorrow at ${timeStr}.`,
        data: {
          url: `/(app)/applications/${application.id}`,
          applicationId: application.id,
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
      },
    })
  }

  // 2. Reminder: 1 Hour Prior
  const oneHourBeforeMs = interviewTimeMs - 60 * 60 * 1000
  if (oneHourBeforeMs > nowMs) {
    const secondsUntil = Math.floor((oneHourBeforeMs - nowMs) / 1000)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Interview Starting in 1 Hour 🚨`,
        body: `${application.company} • ${application.jobTitle}${application.meetingLink ? ' — Tap to view meeting link' : ''}`,
        data: {
          url: `/(app)/applications/${application.id}`,
          applicationId: application.id,
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
      },
    })
  }
}

/**
 * Trigger immediate local notification on application status change.
 */
export async function sendStatusChangeNotification(
  company: string,
  jobTitle: string,
  newStatus: string,
  applicationId: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Status Changed: ${company}`,
      body: `Your application for ${jobTitle} was moved to ${newStatus}.`,
      data: {
        url: `/(app)/applications/${applicationId}`,
        applicationId,
      },
      sound: true,
    },
    trigger: null, // send immediately
  })
}
