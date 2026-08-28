export interface SocialLinks {
  linkedin?: string
  github?: string
  portfolio?: string
  twitter?: string
  other?: string
}

export type SocialPlatformKey = keyof SocialLinks

export interface SocialPlatformConfig {
  key: SocialPlatformKey
  label: string
  placeholder: string
  icon: string
  validate: (url: string) => string | null
}

function isValidHttpUrl(url: string): boolean {
  if (!url) return true
  const trimmed = url.trim()
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/your-profile',
    icon: '💼',
    validate: (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return null
      if (!isValidHttpUrl(trimmed)) {
        return 'LinkedIn URL must start with http:// or https://'
      }
      if (!trimmed.toLowerCase().includes('linkedin.com')) {
        return 'Please enter a valid LinkedIn profile URL (must contain linkedin.com).'
      }
      return null
    },
  },
  {
    key: 'github',
    label: 'GitHub',
    placeholder: 'https://github.com/username',
    icon: '💻',
    validate: (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return null
      if (!isValidHttpUrl(trimmed)) {
        return 'GitHub URL must start with http:// or https://'
      }
      if (!trimmed.toLowerCase().includes('github.com')) {
        return 'Please enter a valid GitHub profile URL (must contain github.com).'
      }
      return null
    },
  },
  {
    key: 'portfolio',
    label: 'Portfolio / Personal Website',
    placeholder: 'https://yourwebsite.com',
    icon: '🌐',
    validate: (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return null
      if (!isValidHttpUrl(trimmed)) {
        return 'Portfolio URL must start with http:// or https://'
      }
      return null
    },
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    placeholder: 'https://x.com/username',
    icon: '🐦',
    validate: (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return null
      if (!isValidHttpUrl(trimmed)) {
        return 'X / Twitter URL must start with http:// or https://'
      }
      const lower = trimmed.toLowerCase()
      if (!lower.includes('x.com') && !lower.includes('twitter.com')) {
        return 'Please enter a valid X / Twitter profile URL (must contain x.com or twitter.com).'
      }
      return null
    },
  },
  {
    key: 'other',
    label: 'Other Professional Link',
    placeholder: 'https://blog.yourwebsite.com',
    icon: '🔗',
    validate: (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return null
      if (!isValidHttpUrl(trimmed)) {
        return 'URL must start with http:// or https://'
      }
      return null
    },
  },
]
