import { createClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './supabaseConfig'

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
const { url, anonKey } = readSupabaseConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
