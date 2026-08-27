import { supabase } from './supabaseClient'

/**
 * Fire-and-forget trigger for the post-signup welcome email.
 *
 * Invokes the `send-welcome-email` Supabase Edge Function, which sends the mail
 * server-side via Resend. The Resend API key lives only in that function's
 * environment — it is never referenced here and never exposed to the client.
 *
 * This never rejects. A failed, misconfigured, or unreachable function must
 * never break account creation, so every error (SDK-reported or thrown) is
 * captured and returned. Callers may ignore the result entirely.
 *
 * Boundary: Signup ViewModel -> welcomeEmailService -> supabaseClient -> Edge Function.
 */

export interface WelcomeEmailInput {
  /** The new user's display name; used to address the email. May be empty. */
  name: string
  /** The recipient address — the email the account was created with. */
  email: string
}

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<{ error: unknown | null }> {
  try {
    const { error } = await supabase.functions.invoke('send-welcome-email', {
      body: { name: input.name, email: input.email },
    })
    return { error: error ?? null }
  } catch (error) {
    return { error }
  }
}
