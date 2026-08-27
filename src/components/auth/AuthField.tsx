import type { ReactNode } from 'react'
import {
  authErrorText,
  authHintText,
  authInputBase,
  authInputError,
  authLabel,
} from './authTheme'

interface AuthFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  /** Native input type. Defaults to 'text'; PasswordField drives this. */
  type?: string
  autoComplete?: string
  autoFocus?: boolean
  /** Inline validation message; presence also toggles the invalid styling + aria. */
  error?: string
  /** Persistent helper text shown beneath the field (e.g. password length). */
  hint?: string
  /**
   * Element rendered inside the input on the right (e.g. a show/hide toggle).
   * When present the input gets extra right padding so text never sits under it.
   */
  trailing?: ReactNode
}

/**
 * Presentational auth input: a label, a premium dark input, and optional
 * hint/error text — nothing else. It owns no form state and performs no
 * validation; the ViewModel passes `value`/`error` in and receives changes via
 * `onChange`. Accessibility is preserved exactly as the original views wired it:
 * `aria-invalid` reflects the error, and `aria-describedby` points at the hint
 * (when present) and the error (when present), in that order.
 */
function AuthField({
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  autoFocus,
  error,
  hint,
  trailing,
}: AuthFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label htmlFor={id} className={authLabel}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${authInputBase} ${trailing ? 'pr-12' : ''} ${
            error ? authInputError : ''
          }`}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {trailing}
          </div>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className={`mt-2 ${authHintText}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={`mt-2 ${authErrorText}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default AuthField
