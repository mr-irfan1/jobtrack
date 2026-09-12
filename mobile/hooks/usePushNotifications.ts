import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { registerForPushNotificationsAsync } from '../services/mobilePushNotificationService'

export function usePushNotifications() {
  const router = useRouter()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null)

  const notificationListener = useRef<Notifications.Subscription | null>(null)
  const responseListener = useRef<Notifications.Subscription | null>(null)

  useEffect(() => {
    // 1. Request permissions & register token
    registerForPushNotificationsAsync().then((result) => {
      if (result.token) {
        setExpoPushToken(result.token)
      }
    })

    // 2. Foreground notification listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif)
      })

    // 3. Notification tap / interaction response listener
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data
        if (data && typeof data.url === 'string') {
          router.push(data.url as any)
        }
      })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [router])

  return {
    expoPushToken,
    notification,
  }
}
