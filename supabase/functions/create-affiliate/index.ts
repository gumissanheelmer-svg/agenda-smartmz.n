import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CreateAffiliateRequest {
  name: string
  email: string
  password: string
  phone?: string
  commission_fixed: number
  commission_percentage: number
  referral_code: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Validate caller is superadmin
    const { data: userData, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: isSuperAdmin } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('role', 'superadmin')
      .maybeSingle()

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Apenas SuperAdmin pode criar afiliados' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateAffiliateRequest = await req.json()
    const { name, email, password, phone, commission_fixed, commission_percentage, referral_code } = body

    if (!name?.trim() || !email?.trim() || !password?.trim() || !referral_code?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: name, email, password, referral_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check referral_code uniqueness
    const { data: existingCode } = await supabaseAdmin
      .from('affiliates_agenda')
      .select('id')
      .eq('referral_code', referral_code.trim())
      .maybeSingle()

    if (existingCode) {
      return new Response(
        JSON.stringify({ error: 'Este código de indicação já está em uso' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check email uniqueness in affiliates
    const { data: existingEmail } = await supabaseAdmin
      .from('affiliates_agenda')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'Já existe um afiliado com este email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
    })

    if (createUserError) {
      if (createUserError.message.includes('already registered') || createUserError.message.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado no sistema. Use outro email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível criar a conta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = newUser.user.id

    // Create affiliate record
    const { error: affiliateError } = await supabaseAdmin
      .from('affiliates_agenda')
      .insert({
        user_id: newUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        commission_fixed: commission_fixed || 0,
        commission_percentage: commission_percentage || 30,
        referral_code: referral_code.trim(),
        status: 'active',
        active: true,
        created_by_superadmin: userData.user.id,
      })

    if (affiliateError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: `Erro ao criar afiliado: ${affiliateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign affiliate role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: 'affiliate',
      })

    if (roleError) {
      console.error('Role insert error (non-fatal):', roleError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Afiliado ${name} criado com sucesso`,
        affiliateUserId: newUserId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
