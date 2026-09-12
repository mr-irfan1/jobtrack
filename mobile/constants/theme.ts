export const Palette = {
  light: {
    background: '#f4f5f7',
    foreground: '#0f172a',
    mutedForeground: '#64748b',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    muted: '#eef1f4',
    border: '#e3e7ec',
    input: '#ffffff',
    inputBorder: '#cbd5e1',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    ring: '#2563eb',
    success: '#059669',
    successFg: '#047857',
    warning: '#d97706',
    warningFg: '#b45309',
    danger: '#dc2626',
    dangerFg: '#b91c1c',
  },
  dark: {
    background: '#0b0c0e',
    foreground: '#f3f5f7',
    mutedForeground: '#9aa4b2',
    surface: '#151719',
    surfaceElevated: '#1c1f22',
    muted: '#22262b',
    border: '#2a2f35',
    input: '#1a1a1a',
    inputBorder: '#374151',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    ring: '#3b82f6',
    success: '#10b981',
    successFg: '#6ee7b7',
    warning: '#f59e0b',
    warningFg: '#fcd34d',
    danger: '#ef4444',
    dangerFg: '#fca5a5',
  },
}

export type ApplicationStatusType =
  | 'Wishlist'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Rejected'

export const StatusBadgeTokens: Record<
  ApplicationStatusType,
  {
    light: { bg: string; text: string; border: string }
    dark: { bg: string; text: string; border: string }
  }
> = {
  Wishlist: {
    light: { bg: '#eef1f4', text: '#475569', border: '#e2e8f0' },
    dark: { bg: '#22262b', text: '#94a3b8', border: '#334155' },
  },
  Applied: {
    light: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    dark: { bg: '#1e3a8a44', text: '#93c5fd', border: '#1e40af66' },
  },
  Interview: {
    light: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    dark: { bg: '#78350f44', text: '#fde047', border: '#92400e66' },
  },
  Offer: {
    light: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    dark: { bg: '#064e3b44', text: '#6ee7b7', border: '#065f4666' },
  },
  Rejected: {
    light: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    dark: { bg: '#7f1d1d44', text: '#fca5a5', border: '#991b1b66' },
  },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const TypographyTokens = {
  fontFamily: undefined, // Uses native system font (-apple-system / Roboto)
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 18,
    xl: 22,
    '2xl': 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const

export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const
