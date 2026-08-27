// JobTrack — "send-welcome-email" Supabase Edge Function
// =====================================================
// Sends the "account created" welcome email server-side via Resend after a
// successful signup. The client triggers it through
// `supabase.functions.invoke('send-welcome-email', { body: { name, email } })`.
//
// Security:
//   - RESEND_API_KEY is read from Deno.env and used only here, server-side. It
//     is never returned in a response and never reaches client code.
//   - APP_URL is read from Deno.env and substituted into the template's single
//     {{APP_URL}} placeholder (the CTA link). No domain is hardcoded.
//
// The HTML below is a faithful copy of the canonical design deliverable at
// `email-templates/welcome-email.html`. It is embedded (not read from disk)
// because a deployed Edge Function only bundles files inside its own directory,
// so the repo-root template is not readable at runtime. Keep the two in sync;
// the template file remains the source of truth for the design.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SENDER = 'JobTrack <hello@jobtrack.co.in>'
const SUBJECT = 'Welcome to JobTrack — Your Account is Created'

// The client invokes this from the browser, so answer CORS preflight and echo
// the allow headers on every response.
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Keep the recipient display name safe for the `Name <email>` form: drop the
// characters that would break address parsing or allow header injection.
function toRecipient(name: string, email: string): string {
  const safeName = name.replace(/[<>"\r\n,;]/g, '').trim()
  return safeName ? `${safeName} <${email}>` : email
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    // Misconfiguration — surface a generic, key-free message. The caller treats
    // any failure as non-fatal, so signup is unaffected.
    console.error('send-welcome-email: RESEND_API_KEY is not set')
    return jsonResponse({ error: 'Email service is not configured' }, 500)
  }

  const appUrl = Deno.env.get('APP_URL')
  if (!appUrl) {
    // The template's only placeholder is the CTA link; without APP_URL the link
    // would be empty. Log it but still send — a welcome email without a perfect
    // link beats no email at all.
    console.warn('send-welcome-email: APP_URL is not set; CTA link will be empty')
  }

  let payload: { name?: unknown; email?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : ''
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  if (!email) {
    return jsonResponse({ error: 'Missing recipient email' }, 400)
  }

  // Use a function replacement so a `$` in APP_URL is never treated as a special
  // replacement pattern.
  const html = WELCOME_EMAIL_HTML.replaceAll('{{APP_URL}}', () => appUrl ?? '')

  let providerResponse: Response
  try {
    providerResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER,
        to: [toRecipient(name, email)],
        subject: SUBJECT,
        html,
      }),
    })
  } catch (cause) {
    console.error('send-welcome-email: request to Resend failed', cause)
    return jsonResponse({ error: 'Failed to reach email provider' }, 502)
  }

  if (!providerResponse.ok) {
    const detail = await providerResponse.text()
    console.error(
      `send-welcome-email: Resend returned ${providerResponse.status}: ${detail}`,
    )
    return jsonResponse(
      { error: 'Email provider rejected the request' },
      502,
    )
  }

  const result = (await providerResponse.json()) as { id?: string }
  return jsonResponse({ id: result.id ?? null }, 200)
})

// --- Embedded template (faithful copy of email-templates/welcome-email.html) ---
const WELCOME_EMAIL_HTML = `<!doctype html>
<!--
  JobTrack — "Account created" welcome email (DESIGN TEMPLATE ONLY)
  =================================================================
  Subject line (set by the SENDER, not this HTML): Your JobTrack Account is Created 🎉

  This file is a design deliverable. It is intentionally NOT imported by the app
  and NOT wired to any provider. It contains NO secrets and NO API keys.

  {{APP_URL}} is the only placeholder. Replace it (server-side, at send time)
  with the app's configured production URL — do NOT hardcode an unknown domain
  here. Suggested source: a server-side env var (e.g. APP_URL) mirroring the
  client's VITE_APP_URL if/when one is introduced. The only real routes linked
  are "/" (Dashboard) and "/applications"; no routes are invented.

  Sending must happen from a server-side context (see the accompanying report:
  Resend + a Supabase Edge Function). Never send this from the browser with a
  private API key.
-->
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Your JobTrack Account is Created</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      /* Client resets */
      body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f4f5f7; }
      table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      a { text-decoration: none; }

      /* Mobile */
      @media only screen and (max-width: 600px) {
        .sm-full { width: 100% !important; }
        .sm-px { padding-left: 24px !important; padding-right: 24px !important; }
        .sm-py { padding-top: 28px !important; padding-bottom: 28px !important; }
        .sm-h1 { font-size: 26px !important; line-height: 34px !important; }
        .sm-cta { display: block !important; width: 100% !important; }
        .sm-stack { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7;">
    <!-- Preheader (hidden preview text) -->
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f4f5f7;">
      Your JobTrack account is ready — start tracking applications and scheduling interviews today.
      &#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <!-- Card -->
          <table role="presentation" class="sm-full" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(16,24,40,0.08); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

            <!-- Brand bar -->
            <tr>
              <td style="background-color:#4f46e5; padding:24px 40px;" class="sm-px">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="middle" style="padding-right:12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" valign="middle" width="36" height="36" style="width:36px; height:36px; background-color:rgba(255,255,255,0.16); border-radius:10px; color:#ffffff; font-size:18px; font-weight:700;">&#10003;</td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle" style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.2px;">JobTrack</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hero -->
            <tr>
              <td class="sm-px sm-py" style="padding:40px 40px 8px 40px;">
                <h1 class="sm-h1" style="margin:0; font-size:30px; line-height:38px; font-weight:700; color:#101828; letter-spacing:-0.4px;">
                  Welcome to JobTrack! &#127881;
                </h1>
                <p style="margin:16px 0 0 0; font-size:16px; line-height:26px; color:#475467;">
                  Your account has been <strong style="color:#101828;">successfully created</strong>. You're now ready to organize your job search, track applications, schedule interviews, and stay on top of every opportunity.
                </p>
              </td>
            </tr>

            <!-- Feature cards -->
            <tr>
              <td class="sm-px" style="padding:24px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="sm-stack" valign="top" width="33.33%" style="padding-right:8px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid #eef0f3; border-radius:12px;">
                        <tr><td style="padding:16px;">
                          <div style="font-size:20px; line-height:20px;">&#128203;</div>
                          <div style="margin-top:10px; font-size:14px; font-weight:600; color:#101828;">Track applications</div>
                          <div style="margin-top:4px; font-size:13px; line-height:19px; color:#667085;">Every role in one organized place.</div>
                        </td></tr>
                      </table>
                    </td>
                    <td class="sm-stack" valign="top" width="33.33%" style="padding-left:4px; padding-right:4px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid #eef0f3; border-radius:12px;">
                        <tr><td style="padding:16px;">
                          <div style="font-size:20px; line-height:20px;">&#128197;</div>
                          <div style="margin-top:10px; font-size:14px; font-weight:600; color:#101828;">Schedule interviews</div>
                          <div style="margin-top:4px; font-size:13px; line-height:19px; color:#667085;">Never miss a date or a follow-up.</div>
                        </td></tr>
                      </table>
                    </td>
                    <td class="sm-stack" valign="top" width="33.33%" style="padding-left:8px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid #eef0f3; border-radius:12px;">
                        <tr><td style="padding:16px;">
                          <div style="font-size:20px; line-height:20px;">&#127919;</div>
                          <div style="margin-top:10px; font-size:14px; font-weight:600; color:#101828;">Organize your search</div>
                          <div style="margin-top:4px; font-size:13px; line-height:19px; color:#667085;">See progress at a glance.</div>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td class="sm-px" style="padding:28px 40px 8px 40px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{APP_URL}}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="23%" strokecolor="#4f46e5" fillcolor="#4f46e5">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Open JobTrack</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a class="sm-cta" href="{{APP_URL}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:600; line-height:20px; padding:16px 32px; border-radius:12px; text-align:center;">
                  Open JobTrack
                </a>
                <!--<![endif]-->
              </td>
            </tr>

            <!-- Closing line -->
            <tr>
              <td class="sm-px" style="padding:20px 40px 40px 40px;">
                <p style="margin:0; font-size:15px; line-height:24px; color:#475467;">
                  Your next opportunity starts with one application.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 40px;" class="sm-px">
                <div style="height:1px; background-color:#eef0f3; line-height:1px; font-size:1px;">&nbsp;</div>
              </td>
            </tr>

            <!-- Footer (echoes the in-app JobTrack footer branding) -->
            <tr>
              <td class="sm-px" style="padding:28px 40px 36px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="middle" style="padding-right:10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" valign="middle" width="30" height="30" style="width:30px; height:30px; background-color:#4f46e5; border-radius:8px; color:#ffffff; font-size:15px; font-weight:700;">&#10003;</td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle" style="font-size:16px; font-weight:700; color:#101828;">JobTrack</td>
                  </tr>
                </table>
                <p style="margin:12px 0 0 0; font-size:13px; line-height:20px; color:#667085;">
                  Track applications. Land opportunities.
                </p>
                <p style="margin:16px 0 0 0; font-size:12px; line-height:18px; color:#98a2b3;">
                  &copy; 2026 JobTrack. All rights reserved.<br />
                  You're receiving this email because an account was created with this address.
                </p>
              </td>
            </tr>
          </table>
          <!-- /Card -->
        </td>
      </tr>
    </table>
  </body>
</html>
`
