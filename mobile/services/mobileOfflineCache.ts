import AsyncStorage from '@react-native-async-storage/async-storage'
import type { JobApplication } from '../types/application'

const CACHE_KEYS = {
  APPLICATIONS: 'jobtrack_offline_cached_applications_v1',
  PROFILE: 'jobtrack_offline_cached_profile_v1',
  LAST_SYNC: 'jobtrack_offline_last_sync_v1',
}

export async function saveCachedApplications(
  applications: JobApplication[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEYS.APPLICATIONS,
      JSON.stringify(applications),
    )
    await AsyncStorage.setItem(
      CACHE_KEYS.LAST_SYNC,
      new Date().toISOString(),
    )
  } catch (err) {
    console.warn('Failed to cache applications:', err)
  }
}

export async function getCachedApplications(): Promise<JobApplication[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.APPLICATIONS)
    if (!raw) return null
    return JSON.parse(raw) as JobApplication[]
  } catch {
    return null
  }
}

export async function saveCachedProfile(profile: Record<string, unknown>): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile))
  } catch (err) {
    console.warn('Failed to cache profile:', err)
  }
}

export async function getCachedProfile(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.PROFILE)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}
