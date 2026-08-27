import { MoonIcon, SunIcon } from '../icons/Icons'
import { useTheme } from '../../theme/useTheme'

// Quiet header control, matching the sign-out button's treatment so the top bar
// reads as one coherent set. Themed via tokens so it works in both modes.
const toggleClasses =
  'inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Header theme toggle. Shows the current theme's glyph (sun in light, moon in
 * dark) and flips to the other theme on click via useTheme().toggleTheme. The
 * accessible label describes the ACTION ("Switch to dark theme") so screen
 * readers announce what pressing it does. Presentation only — no app state.
 */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={toggleClasses}
    >
      {isDark ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  )
}

export default ThemeToggle
