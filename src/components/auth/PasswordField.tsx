import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons/Icons'
import AuthField from './AuthField'

interface PasswordFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  error?: string
  hint?: string
}

/**
 * Password variant of {@link AuthField} with a show/hide toggle. The toggle is
 * purely presentational — it flips the input's `type` between 'password' and
 * 'text' and never alters the value, validation, or the field's existing
 * hint/error aria wiring. The button is a real, keyboard-focusable control with
 * an accessible label and `aria-pressed` state, and is excluded from the tab
 * order's field flow only in the sense that it follows the input naturally.
 */
function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <AuthField
      id={id}
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      }
    />
  )
}

export default PasswordField
