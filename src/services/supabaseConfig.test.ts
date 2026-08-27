import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readSupabaseConfig } from './supabaseConfig.ts'

test('readSupabaseConfig returns url and anonKey when both are present', () => {
  const config = readSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'anon-test-key',
  })
  assert.deepEqual(config, {
    url: 'https://example.supabase.co',
    anonKey: 'anon-test-key',
  })
})

test('readSupabaseConfig trims surrounding whitespace', () => {
  const config = readSupabaseConfig({
    VITE_SUPABASE_URL: '  https://example.supabase.co  ',
    VITE_SUPABASE_ANON_KEY: '  anon-test-key  ',
  })
  assert.equal(config.url, 'https://example.supabase.co')
  assert.equal(config.anonKey, 'anon-test-key')
})

test('readSupabaseConfig throws when the URL is missing', () => {
  assert.throws(
    () => readSupabaseConfig({ VITE_SUPABASE_ANON_KEY: 'anon-test-key' }),
    /VITE_SUPABASE_URL/,
  )
})

test('readSupabaseConfig throws when the anon key is missing', () => {
  assert.throws(
    () =>
      readSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' }),
    /VITE_SUPABASE_ANON_KEY/,
  )
})

test('readSupabaseConfig throws and names both when both are missing', () => {
  assert.throws(
    () => readSupabaseConfig({}),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      assert.match(error.message, /VITE_SUPABASE_URL/)
      assert.match(error.message, /VITE_SUPABASE_ANON_KEY/)
      return true
    },
  )
})

test('readSupabaseConfig treats blank/whitespace values as missing', () => {
  assert.throws(
    () =>
      readSupabaseConfig({
        VITE_SUPABASE_URL: '   ',
        VITE_SUPABASE_ANON_KEY: '',
      }),
    /VITE_SUPABASE_URL/,
  )
})

test('readSupabaseConfig error message never contains a provided value', () => {
  // Guards against a credential leaking into an error string or stack trace: the
  // key is present, the URL is missing, so the error is thrown while the secret
  // value is in scope — it must not appear in the message.
  const secretKey = 'super-secret-anon-value'
  try {
    readSupabaseConfig({
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: secretKey,
    })
    assert.fail('expected readSupabaseConfig to throw')
  } catch (error) {
    assert.ok(error instanceof Error)
    assert.ok(
      !error.message.includes(secretKey),
      'error message must not include credential values',
    )
  }
})
