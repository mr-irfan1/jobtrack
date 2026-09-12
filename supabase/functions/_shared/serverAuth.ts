/**
 * Result of internal backend worker authentication validation.
 */
export interface ServerAuthResult {
  authorized: boolean
  errorResponse?: Response
}

/**
 * Validates server-to-server authorization for internal backend workers like `ingest-jobs`.
 *
 * Security:
 * - Requires Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> OR
 *   x-ingestion-secret: <INGESTION_SECRET>
 * - Never allows unauthenticated public access.
 * - Never echoes secrets in responses or logs.
 */
export function requireServerAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): ServerAuthResult {
  const getEnv = (k: string): string | undefined => {
    if (typeof Deno !== 'undefined' && typeof Deno.env !== 'undefined') {
      return Deno.env.get(k)
    }
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
    return g.process?.env?.[k]
  }

  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const ingestionSecret = getEnv('INGESTION_SECRET')

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null
  const secretHeader = req.headers.get('x-ingestion-secret') || req.headers.get('x-api-key')

  // 1. Verify service_role key
  if (serviceRoleKey && bearerToken && bearerToken === serviceRoleKey) {
    return { authorized: true }
  }

  // 2. Verify ingestion secret header
  if (ingestionSecret && secretHeader && secretHeader === ingestionSecret) {
    return { authorized: true }
  }

  // 3. Optional local bypass for automated tests only when explicitly configured
  if (getEnv('ALLOW_INSECURE_LOCAL_INGESTION') === 'true') {
    return { authorized: true }
  }

  return {
    authorized: false,
    errorResponse: new Response(
      JSON.stringify({
        error: 'Unauthorized: Internal backend worker requires valid service-role key or ingestion secret.',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    ),
  }
}
