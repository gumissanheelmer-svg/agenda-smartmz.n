import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { event_type, email, metadata } = await req.json()

    if (!event_type || !email) {
      return new Response(
        JSON.stringify({ error: 'event_type and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Capture IP from request headers
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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
      email: email.toLowerCase().trim(),
      user_id,
      ip_address,
      metadata: metadata || {},
    })

    // Check for account lockout (10+ failed logins in 15 minutes)
    let is_locked = false
    if (event_type === 'login_failed') {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      
      const { count } = await supabaseAdmin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('email', email.toLowerCase().trim())
        .eq('event_type', 'login_failed')
        .gte('created_at', fifteenMinAgo)

      if (count && count >= 10) {
        is_locked = true
        // Log lockout event
        await supabaseAdmin.from('security_events').insert({
          event_type: 'account_locked',
          email: email.toLowerCase().trim(),
          user_id,
          ip_address,
          metadata: { reason: 'Too many failed login attempts', failed_count: count },
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
      JSON.stringify({ success: true, is_locked, ip_blocked }),
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
