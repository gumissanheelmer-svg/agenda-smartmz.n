import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

/**
 * Progressive delay calculation based on failed attempts.
 * Returns milliseconds to wait before next attempt is allowed.
 */
function calculateProgressiveDelay(failedCount: number): number {
  if (failedCount <= 2) return 0
  if (failedCount <= 4) return 2_000   // 2s
  if (failedCount <= 6) return 5_000   // 5s
  if (failedCount <= 8) return 15_000  // 15s
  if (failedCount <= 10) return 30_000 // 30s
  return 60_000                        // 1 min
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { event_type, email, metadata, action } = body

    // Capture IP from request headers
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ──────────────────────────────────────────────
    // ACTION: "check" — Pre-login rate limit check
    // Called BEFORE attempting authentication
    // ──────────────────────────────────────────────
    if (action === 'check') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'email is required for check action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const normalizedEmail = email.toLowerCase().trim()
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

      // Count recent failed attempts for this email
      const { count: emailFailCount } = await supabaseAdmin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .eq('event_type', 'login_failed')
        .gte('created_at', fifteenMinAgo)

      const failCount = emailFailCount || 0

      // Check if account is locked (10+ failures in 15 min)
      const is_locked = failCount >= 10

      // Check IP-based blocking (20+ failed from same IP in 1 hour)
      let ip_blocked = false
      if (ip_address) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { count: ipFailCount } = await supabaseAdmin
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .eq('ip_address', ip_address)
          .eq('event_type', 'login_failed')
          .gte('created_at', oneHourAgo)

        if (ipFailCount && ipFailCount >= 20) {
          ip_blocked = true
        }
      }

      const delay_ms = calculateProgressiveDelay(failCount)
      const remaining_attempts = Math.max(0, 10 - failCount)

      return new Response(
        JSON.stringify({
          allowed: !is_locked && !ip_blocked,
          is_locked,
          ip_blocked,
          delay_ms,
          remaining_attempts,
          failed_attempts: failCount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ──────────────────────────────────────────────
    // ACTION: "log" (default) — Log a security event
    // ──────────────────────────────────────────────
    if (!event_type || !email) {
      return new Response(
        JSON.stringify({ error: 'event_type and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Extract user_id from auth header if present
    let user_id: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabaseUser = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        )
        const { data } = await supabaseUser.auth.getUser()
        user_id = data?.user?.id || null
      } catch {
        // ignore — unauthenticated events are expected
      }
    }

    // Insert security event
    await supabaseAdmin.from('security_events').insert({
      event_type,
      email: normalizedEmail,
      user_id,
      ip_address,
      metadata: metadata || {},
    })

    // Check for account lockout (10+ failed logins in 15 minutes)
    let is_locked = false
    let delay_ms = 0
    let failed_attempts = 0

    if (event_type === 'login_failed') {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

      const { count } = await supabaseAdmin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .eq('event_type', 'login_failed')
        .gte('created_at', fifteenMinAgo)

      failed_attempts = count || 0
      delay_ms = calculateProgressiveDelay(failed_attempts)

      if (failed_attempts >= 10) {
        is_locked = true
        // Log lockout event
        await supabaseAdmin.from('security_events').insert({
          event_type: 'account_locked',
          email: normalizedEmail,
          user_id,
          ip_address,
          metadata: { reason: 'Too many failed login attempts', failed_count: failed_attempts },
        })
      }
    }

    // Check for IP-based blocking (20+ failed events in 1 hour)
    let ip_blocked = false
    if (ip_address && event_type === 'login_failed') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { count } = await supabaseAdmin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip_address)
        .eq('event_type', 'login_failed')
        .gte('created_at', oneHourAgo)

      if (count && count >= 20) {
        ip_blocked = true
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_locked,
        ip_blocked,
        delay_ms,
        failed_attempts,
        remaining_attempts: Math.max(0, 10 - failed_attempts),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Security event error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
