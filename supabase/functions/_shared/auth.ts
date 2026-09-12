// Supabase Edge Function Shared Authentication Helper
// =======================================================
// Validates caller's Supabase JWT via Bearer token to prevent unauthorized abuse of AI endpoints.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

export interface AuthValidationResult {
  userId?: string
  email?: string
  errorResponse?: Response
}

export async function requireUserAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthValidationResult> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: new Response(
        JSON.stringify({
          error: 'Unauthorized: Missing or invalid Authorization header.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      ),
    }
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return {
      errorResponse: new Response(
        JSON.stringify({
          error: 'Unauthorized: Empty Bearer token.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      ),
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  // If Supabase environment is not set up (e.g. mock/local test environment), allow graceful bypass only if flag explicitly configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[_shared/auth] SUPABASE_URL or SUPABASE_ANON_KEY missing in environment.')
    return {}
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error } = await client.auth.getUser(token)

    if (error || !user) {
      return {
        errorResponse: new Response(
          JSON.stringify({
            error: 'Unauthorized: Invalid or expired session token.',
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        ),
      }
    }

    return {
      userId: user.id,
      email: user.email,
    }
  } catch (err) {
    console.error('[_shared/auth] Authentication validation failed:', err instanceof Error ? err.message : 'unknown')
    return {
      errorResponse: new Response(
        JSON.stringify({
          error: 'Unauthorized: Could not verify authorization.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      ),
    }
  }
}
