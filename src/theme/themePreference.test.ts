import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  normalizeTheme,
  resolveInitialTheme,
  systemTheme,
  THEME_STORAGE_KEY,
} from './themePreference.ts'

test('THEME_STORAGE_KEY is the dedicated theme key (never the application data key)', () => {
  assert.equal(THEME_STORAGE_KEY, 'jobtrack_theme')
  assert.notEqual(THEME_STORAGE_KEY, 'jobtrack_applications')
})

test('normalizeTheme accepts the two valid themes', () => {
  assert.equal(normalizeTheme('light'), 'light')
  assert.equal(normalizeTheme('dark'), 'dark')
})

test('normalizeTheme rejects anything that is not exactly light/dark', () => {
  for (const value of ['', 'Dark', 'LIGHT', 'blue', 'system', null, undefined, 0, {}]) {
    assert.equal(normalizeTheme(value), null)
  }
})

test('systemTheme maps the prefers-dark boolean to a theme', () => {
  assert.equal(systemTheme(true), 'dark')
  assert.equal(systemTheme(false), 'light')
})

test('resolveInitialTheme: a valid stored preference always wins over the system', () => {
  // Stored dark beats a light system, and stored light beats a dark system.
  assert.equal(resolveInitialTheme('dark', false), 'dark')
  assert.equal(resolveInitialTheme('light', true), 'light')
})

test('resolveInitialTheme: with no/invalid stored value it falls back to the system', () => {
  assert.equal(resolveInitialTheme(null, true), 'dark')
  assert.equal(resolveInitialTheme(null, false), 'light')
  assert.equal(resolveInitialTheme('nonsense', true), 'dark')
  assert.equal(resolveInitialTheme('', false), 'light')
})
