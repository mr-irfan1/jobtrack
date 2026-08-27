/**
 * Reads and validates the Supabase configuration from Vite environment
 * variables.
 *
 * Kept separate from supabaseClient so the validation is a pure, side-effect-free
 * function that can be unit-tested without a real Supabase connection or any
 * real credentials — the client module only ever calls it with import.meta.env.
 */

/**
 * The Vite env values this project reads for Supabase. Both are VITE_ prefixed
 * so Vite exposes them to client code. Optional because they may be absent at
 * runtime, which is exactly what readSupabaseConfig guards against.
 */
export interface SupabaseEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

/** Validated, guaranteed-present Supabase configuration. */
export interface SupabaseConfig {
  url: string
  anonKey: string
}

/**
 * Validate the env and return the Supabase config, or throw a clear error
 * naming any missing variable(s). Blank/whitespace-only values count as missing.
 *
 * The error names variables only — it never includes their values — so no
 * credential can leak through the message or a stack trace.
 */
export function readSupabaseConfig(env: SupabaseEnv): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

  // A combined guard (rather than checking a `missing` array's length) so the
  // compiler narrows url/anonKey to `string` for the return under strict null
  // checks; both are known non-empty once past this throw.
  if (!url || !anonKey) {
    const missing: string[] = []
    if (!url) missing.push('VITE_SUPABASE_URL')
    if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
    throw new Error(
      `Missing required Supabase environment variable(s): ${missing.join(', ')}. ` +
        'Add them to .env.local (see .env.example). Never commit real credentials.',
    )
  }

  return { url, anonKey }
}
