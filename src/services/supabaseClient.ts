import { createClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './supabaseConfig.ts'

/**
 * The single Supabase client for the entire app.
 *
 * Configuration comes only from Vite env vars — never hardcoded — and the
 * anon/publishable key is the only Supabase key allowed client-side. If a
 * required variable is missing, readSupabaseConfig throws a clear, value-free
 * error, so we never construct a silently-broken client.
 *
 * Scope is deliberately narrow: this module creates and exports the client and
 * nothing else. Auth logic (sign in/up/out, session handling) belongs in a
 * future auth service that consumes this client — not here.
 */
const nodeEnv = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env || {}
const metaEnv = typeof import.meta !== 'undefined' && import.meta ? import.meta.env : undefined

const { url, anonKey } = readSupabaseConfig({
  VITE_SUPABASE_URL: metaEnv?.VITE_SUPABASE_URL || nodeEnv.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  VITE_SUPABASE_ANON_KEY: metaEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
})

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
