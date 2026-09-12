import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export function extractHttpUrlFromText(text: string): string | null {
  if (!text || typeof text !== 'string') return null
  const urlRegex = /(https?:\/\/[^\s]+)/i
  const match = urlRegex.exec(text)
  if (!match) return null

  const candidate = match[1].replace(/[),;.!'"?]+$/, '')
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return candidate
    }
  } catch {
    return null
  }
  return null
}

export function parseIncomingJobUrl(incomingUrl: string): string | null {
  if (!incomingUrl) return null

  try {
    const parsed = Linking.parse(incomingUrl)

    // 1. Direct query parameter: ?url=... or ?jobUrl=... or ?link=...
    if (parsed.queryParams) {
      const directUrl =
        parsed.queryParams.url ||
        parsed.queryParams.jobUrl ||
        parsed.queryParams.link ||
        parsed.queryParams.text

      if (typeof directUrl === 'string') {
        const extracted = extractHttpUrlFromText(directUrl)
        if (extracted) return extracted
      }
    }

    // 2. Path matching: jobtrack://import/https%3A%2F%2F...
    if (parsed.path) {
      const extracted = extractHttpUrlFromText(parsed.path)
      if (extracted) return extracted
    }

    // 3. Fallback check on raw incoming URL if it contains a nested HTTP link
    const rawExtracted = extractHttpUrlFromText(incomingUrl)
    if (rawExtracted && !rawExtracted.startsWith('jobtrack://')) {
      return rawExtracted
    }

    return null
  } catch {
    return null
  }
}

export function useIncomingShareLink() {
  const router = useRouter()

  useEffect(() => {
    // A. Handle cold start deep link
    async function checkInitialUrl() {
      try {
        const initialUrl = await Linking.getInitialURL()
        if (initialUrl) {
          const jobUrl = parseIncomingJobUrl(initialUrl)
          if (jobUrl) {
            router.push({
              pathname: '/(app)/import',
              params: { url: jobUrl },
            })
          }
        }
      } catch (err) {
        console.error('Failed to get initial deep link URL:', err)
      }
    }

    checkInitialUrl()

    // B. Handle foreground / background incoming event
    const subscription = Linking.addEventListener('url', (event) => {
      const jobUrl = parseIncomingJobUrl(event.url)
      if (jobUrl) {
        router.push({
          pathname: '/(app)/import',
          params: { url: jobUrl },
        })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [router])
}
