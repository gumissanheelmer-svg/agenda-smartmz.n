import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ── Progressive delay calculation ──
function calculateProgressiveDelay(failedCount: number): number {
  if (failedCount <= 2) return 0
  if (failedCount <= 4) return 2_000
  if (failedCount <= 6) return 5_000
  if (failedCount <= 8) return 15_000
  if (failedCount <= 10) return 30_000
  return 60_000
}

// ── Behavior detection thresholds ──
const BEHAVIOR_THRESHOLDS: Record<string, { maxEvents: number; windowMinutes: number; cooldownSeconds: number }> = {
  login_success:    { maxEvents: 10, windowMinutes: 5,  cooldownSeconds: 120 },
  booking_submit:   { maxEvents: 8,  windowMinutes: 10, cooldownSeconds: 60  },
  payment_submit:   { maxEvents: 5,  windowMinutes: 10, cooldownSeconds: 120 },
  register_submit:  { maxEvents: 3,  windowMinutes: 15, cooldownSeconds: 180 },
  password_reset:   { maxEvents: 3,  windowMinutes: 15, cooldownSeconds: 120 },
  default:          { maxEvents: 20, windowMinutes: 5,  cooldownSeconds: 60  },
}

function getThreshold(eventType: string) {
  return BEHAVIOR_THRESHOLDS[eventType] || BEHAVIOR_THRESHOLDS.default
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { event_type, email, metadata, action } = body

    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ══════════════════════════════════════════════
    // ACTION: "check" — Pre-login rate limit check
    // ══════════════════════════════════════════════
    if (action === 'check') {
      if (!email) {
        return jsonResponse({ error: 'email is required for check action' }, 400)
      }

      const normalizedEmail = email.toLowerCase().trim()
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

      const { count: emailFailCount } = await supabaseAdmin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .eq('event_type', 'login_failed')
        .gte('created_at', fifteenMinAgo)

      const failCount = emailFailCount || 0
      const is_locked = failCount >= 10

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

      return jsonResponse({
        allowed: !is_locked && !ip_blocked,
        is_locked,
        ip_blocked,
        delay_ms,
        remaining_attempts,
        failed_attempts: failCount,
      })
    }

    // ══════════════════════════════════════════════
    // ACTION: "check_behavior" — Behavioral analysis
    // Detects rapid repeated actions, spam patterns
    // ══════════════════════════════════════════════
    if (action === 'check_behavior') {
      const actionType = event_type || 'default'
      const threshold = getThreshold(actionType)
      const windowStart = new Date(Date.now() - threshold.windowMinutes * 60 * 1000).toISOString()
      const events_detected: string[] = []

      let blocked = false
      let reason: string | undefined

      // 1. Check by email (if provided)
      if (email) {
        const normalizedEmail = email.toLowerCase().trim()
        const { count: emailCount } = await supabaseAdmin
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .eq('email', normalizedEmail)
          .eq('event_type', actionType)
          .gte('created_at', windowStart)

        if (emailCount && emailCount >= threshold.maxEvents) {
          blocked = true
          reason = `Email exceeded ${threshold.maxEvents} ${actionType} events in ${threshold.windowMinutes}min`
          events_detected.push('email_frequency_exceeded')
        }
      }

      // 2. Check by IP
      if (!blocked && ip_address) {
        const { count: ipCount } = await supabaseAdmin
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .eq('ip_address', ip_address)
          .eq('event_type', actionType)
          .gte('created_at', windowStart)

        if (ipCount && ipCount >= threshold.maxEvents) {
          blocked = true
          reason = `IP exceeded ${threshold.maxEvents} ${actionType} events in ${threshold.windowMinutes}min`
          events_detected.push('ip_frequency_exceeded')
        }
      }

      // 3. Cross-action anomaly: too many different event types from same IP in short window
      if (!blocked && ip_address) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { count: totalIpEvents } = await supabaseAdmin
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .eq('ip_address', ip_address)
          .gte('created_at', fiveMinAgo)

        if (totalIpEvents && totalIpEvents >= 50) {
          blocked = true
          reason = 'IP has excessive activity across all event types'
          events_detected.push('ip_total_activity_spike')
        }
      }

      // 4. Rapid-fire detection: same action more than 3 times in 10 seconds from same IP
      if (!blocked && ip_address) {
        const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString()
        const { count: burstCount } = await supabaseAdmin
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .eq('ip_address', ip_address)
          .eq('event_type', actionType)
          .gte('created_at', tenSecondsAgo)

        if (burstCount && burstCount >= 3) {
          blocked = true
          reason = 'Rapid-fire activity detected (bot pattern)'
          events_detected.push('rapid_fire_detected')
        }
      }

      // If blocked, log the suspicious event
      if (blocked) {
        await supabaseAdmin.from('security_events').insert({
          event_type: 'suspicious_activity',
          email: email?.toLowerCase().trim() || null,
          ip_address,
          metadata: {
            blocked_action: actionType,
            reason,
            events_detected,
            ...(metadata || {}),
          },
        })
      }

      return jsonResponse({
        allowed: !blocked,
        blocked,
        reason: blocked ? reason : undefined,
        cooldown_seconds: blocked ? threshold.cooldownSeconds : 0,
        events_detected,
      })
    }

    // ══════════════════════════════════════════════
    // ACTION: "log" (default) — Log a security event
    // ══════════════════════════════════════════════
    if (!event_type) {
      return jsonResponse({ error: 'event_type is required' }, 400)
    }

    const normalizedEmail = email?.toLowerCase().trim() || null

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

    // ── Post-log analysis for login_failed ──
    let is_locked = false
    let delay_ms = 0
    let failed_attempts = 0
    let ip_blocked = false

    if (event_type === 'login_failed' && normalizedEmail) {
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
        await supabaseAdmin.from('security_events').insert({
          event_type: 'account_locked',
          email: normalizedEmail,
          user_id,
          ip_address,
          metadata: { reason: 'Too many failed login attempts', failed_count: failed_attempts },
        })
      }

      // IP-based blocking
      if (ip_address) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { count: ipCount } = await supabaseAdmin
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .eq('ip_address', ip_address)
          .eq('event_type', 'login_failed')
          .gte('created_at', oneHourAgo)

        if (ipCount && ipCount >= 20) {
          ip_blocked = true
        }
      }
    }

    // ── Auto-detect suspicious patterns on any event ──
    if (ip_address && event_type !== 'login_failed') {
      const threshold = getThreshold(event_type)
      const windowStart = new Date(Date.now() - threshold.windowMinutes * 60 * 1000).toISOString()

      const { count: eventCount } = await supabaseAdmin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip_address)
        .eq('event_type', event_type)
        .gte('created_at', windowStart)

      if (eventCount && eventCount >= threshold.maxEvents) {
        // Log suspicious activity automatically
        await supabaseAdmin.from('security_events').insert({
          event_type: 'suspicious_activity',
          email: normalizedEmail,
          user_id,
          ip_address,
          metadata: {
            trigger: event_type,
            count: eventCount,
            threshold: threshold.maxEvents,
            window_minutes: threshold.windowMinutes,
            auto_detected: true,
          },
        })
      }
    }

    return jsonResponse({
      success: true,
      is_locked,
      ip_blocked,
      delay_ms,
      failed_attempts,
      remaining_attempts: Math.max(0, 10 - failed_attempts),
    })

  } catch (error) {
    console.error('Security event error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
