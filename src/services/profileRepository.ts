import { supabase } from './supabaseClient.ts'
import type { Achievement } from '../types/achievement.ts'
import type { SocialLinks } from '../types/socialLinks.ts'
import type { UserPreferences } from '../types/userPreferences.ts'
import { getReadIds, getDismissedIds, saveReadIds, saveDismissedIds } from '../components/Notifications/readNotificationsStore.ts'

const PROFILES_TABLE = 'profiles'

export interface UserProfileData {
  id: string
  fullName: string
  headline: string
  location: string
  bio: string
  skills: string[]
  achievements: Achievement[]
  socialLinks: SocialLinks
  preferences: UserPreferences
  readNotificationIds: string[]
  dismissedNotificationIds: string[]
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id || null
  } catch {
    return null
  }
}

/**
 * Fetch profile from public.profiles table.
 */
export async function getProfile(): Promise<UserProfileData | null> {
  const userId = await getAuthUserId()
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      fullName: data.full_name || '',
      headline: data.headline || '',
      location: data.location || '',
      bio: data.bio || '',
      skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
      achievements: Array.isArray(data.achievements) ? (data.achievements as Achievement[]) : [],
      socialLinks: (data.social_links as SocialLinks) || {},
      preferences: (data.preferences as UserPreferences) || {},
      readNotificationIds: Array.isArray(data.read_notification_ids) ? data.read_notification_ids : [],
      dismissedNotificationIds: Array.isArray(data.dismissed_notification_ids) ? data.dismissed_notification_ids : [],
    }
  } catch {
    return null
  }
}

/**
 * Update profile in public.profiles and sync with auth.user_metadata.
 */
export async function updateProfile(updates: Partial<UserProfileData>): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) return

  const dbPayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName
  if (updates.headline !== undefined) dbPayload.headline = updates.headline
  if (updates.location !== undefined) dbPayload.location = updates.location
  if (updates.bio !== undefined) dbPayload.bio = updates.bio
  if (updates.skills !== undefined) dbPayload.skills = updates.skills
  if (updates.achievements !== undefined) dbPayload.achievements = updates.achievements
  if (updates.socialLinks !== undefined) dbPayload.social_links = updates.socialLinks
  if (updates.preferences !== undefined) dbPayload.preferences = updates.preferences
  if (updates.readNotificationIds !== undefined) dbPayload.read_notification_ids = updates.readNotificationIds
  if (updates.dismissedNotificationIds !== undefined) dbPayload.dismissed_notification_ids = updates.dismissedNotificationIds

  try {
    await supabase.from(PROFILES_TABLE).upsert({ id: userId, ...dbPayload })
  } catch {
    // Non-fatal
  }
}

/**
 * Sync read/dismissed notification IDs with the user's remote profile.
 */
export async function syncNotificationState(): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) return

  try {
    const profile = await getProfile()
    if (profile) {
      // Merge remote into local
      const localRead = getReadIds()
      profile.readNotificationIds.forEach((id) => localRead.add(id))
      saveReadIds(localRead)

      const localDismissed = getDismissedIds()
      profile.dismissedNotificationIds.forEach((id) => localDismissed.add(id))
      saveDismissedIds(localDismissed)
    }

    // Push local to remote
    await updateProfile({
      readNotificationIds: Array.from(getReadIds()),
      dismissedNotificationIds: Array.from(getDismissedIds()),
    })
  } catch {
    // Graceful fallback
  }
}
