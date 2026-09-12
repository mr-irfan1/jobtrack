import { useColorScheme } from 'react-native'
import { Palette, Shadows } from '../constants/theme'

export function useTheme() {
  const systemScheme = useColorScheme()
  const isDark = systemScheme === 'dark'
  const colors = isDark ? Palette.dark : Palette.light
  const shadows = isDark ? Shadows.dark : Shadows.light

  return {
    isDark,
    themeName: isDark ? ('dark' as const) : ('light' as const),
    colors,
    shadows,
  }
}
