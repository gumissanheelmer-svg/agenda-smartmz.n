-- =============================================
-- PHASE 1: Evolve payment system for multi-country
-- =============================================

-- 1. Add payment_methods jsonb to barbershops
ALTER TABLE public.barbershops 
  ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb;

-- 2. Add new tracking columns to payment_confirmations
ALTER TABLE public.payment_confirmations
  ADD COLUMN IF NOT EXISTS method_id text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS payer_phone text,
  ADD COLUMN IF NOT EXISTS raw_text text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid;

-- 3. Drop restrictive payment_method check (was limited to mpesa/emola)
ALTER TABLE public.payment_confirmations 
  DROP CONSTRAINT IF EXISTS payment_confirmations_payment_method_check;

-- 4. Replace unique(appointment_id) with partial unique (exclude rejected)
--    This allows resubmission after a rejection
ALTER TABLE public.payment_confirmations 
  DROP CONSTRAINT IF EXISTS unique_appointment_confirmation;

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_appointment_confirmation 
  ON public.payment_confirmations (appointment_id) 
  WHERE status != 'rejected';

-- 5. Code extraction function
CREATE OR REPLACE FUNCTION public.extract_payment_code(
  p_raw_text text,
  p_code_rules jsonb DEFAULT '{}'::jsonb
) RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_cleaned text;
  v_mode text;
  v_prefixes text[];
  v_min_len int;
  v_max_len int;
  v_token text;
  v_tokens text[];
  v_prefix text;
  v_best text := NULL;
BEGIN
  IF p_raw_text IS NULL OR trim(p_raw_text) = '' THEN
    RETURN NULL;
  END IF;

  v_mode := COALESCE(p_code_rules->>'mode', 'prefix');
  v_min_len := COALESCE((p_code_rules->>'minLen')::int, 8);
  v_max_len := COALESCE((p_code_rules->>'maxLen')::int, 20);

  IF p_code_rules ? 'prefixes' THEN
    SELECT array_agg(elem::text) INTO v_prefixes
    FROM jsonb_array_elements_text(p_code_rules->'prefixes') elem;
  ELSE
    v_prefixes := ARRAY[]::text[];
  END IF;

  v_cleaned := upper(trim(p_raw_text));

  -- If input looks like just a code (short alphanumeric)
  IF v_cleaned ~ '^[A-Z0-9]{6,25}$' THEN
    IF length(v_cleaned) >= v_min_len AND length(v_cleaned) <= v_max_len THEN
      RETURN v_cleaned;
    END IF;
  END IF;

  -- Tokenize
  v_tokens := regexp_split_to_array(v_cleaned, '[^A-Z0-9]+');

  -- Mode: prefix - find token starting with known prefix
  IF v_mode = 'prefix' AND v_prefixes IS NOT NULL AND array_length(v_prefixes, 1) > 0 THEN
    FOREACH v_token IN ARRAY v_tokens LOOP
      FOREACH v_prefix IN ARRAY v_prefixes LOOP
        IF v_token LIKE v_prefix || '%'
           AND length(v_token) >= v_min_len 
           AND length(v_token) <= v_max_len THEN
          RETURN v_token;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  -- Fallback: longest alphanumeric token within bounds
  FOREACH v_token IN ARRAY v_tokens LOOP
    IF length(v_token) >= v_min_len AND length(v_token) <= v_max_len THEN
      IF v_best IS NULL OR length(v_token) > length(v_best) THEN
        v_best := v_token;
      END IF;
    END IF;
  END LOOP;

  RETURN v_best;
END;
$$;

-- 6. RPC: submit payment (client-facing, security definer)
CREATE OR REPLACE FUNCTION public.submit_payment_confirmation(
  p_appointment_id uuid,
  p_barbershop_id uuid,
  p_method_id text,
  p_method_label text,
  p_country text,
  p_payer_phone text,
  p_amount numeric,
  p_raw_text text,
  p_code_rules jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_appointment RECORD;
  v_extracted_code text;
  v_existing RECORD;
  v_confirmation_id uuid;
BEGIN
  -- Validate appointment
  SELECT * INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id AND barbershop_id = p_barbershop_id;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  -- Check business has payment required
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = p_barbershop_id AND payment_required = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pagamento não é obrigatório para este negócio');
  END IF;

  -- Extract code
  v_extracted_code := public.extract_payment_code(p_raw_text, p_code_rules);

  IF v_extracted_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido. Cole o SMS completo ou verifique o código.', 'code', 'INVALID_CODE');
  END IF;

  -- Check code reuse (global)
  SELECT * INTO v_existing
  FROM public.payment_confirmations
  WHERE transaction_code = v_extracted_code;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código já foi usado. Use o código do seu pagamento atual.', 'code', 'CODE_REUSED');
  END IF;

  -- Check if appointment already has active confirmation
  SELECT * INTO v_existing
  FROM public.payment_confirmations
  WHERE appointment_id = p_appointment_id AND status != 'rejected';

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Já existe uma submissão de pagamento para este agendamento.', 'code', 'ALREADY_SUBMITTED');
  END IF;

  -- Insert
  INSERT INTO public.payment_confirmations (
    appointment_id, barbershop_id, payment_method,
    method_id, country, payer_phone, phone_expected,
    amount_expected, confirmation_text, raw_text,
    transaction_code, status
  ) VALUES (
    p_appointment_id, p_barbershop_id, p_method_label,
    p_method_id, p_country, p_payer_phone, p_payer_phone,
    p_amount, p_raw_text, p_raw_text,
    v_extracted_code, 'pending'
  )
  RETURNING id INTO v_confirmation_id;

  RETURN jsonb_build_object(
    'success', true,
    'confirmation_id', v_confirmation_id,
    'extracted_code', v_extracted_code
  );

EXCEPTION WHEN unique_violation THEN
  IF SQLERRM LIKE '%unique_transaction_code%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código já foi usado.', 'code', 'CODE_REUSED');
  ELSIF SQLERRM LIKE '%unique_active_appointment%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Já existe submissão para este agendamento.', 'code', 'ALREADY_SUBMITTED');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'code', 'DB_ERROR');
  END IF;
WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'code', 'UNKNOWN_ERROR');
END;
$$;

-- 7. RPC: admin confirms payment
CREATE OR REPLACE FUNCTION public.admin_confirm_payment(p_confirmation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.payment_confirmations
  WHERE id = p_confirmation_id;

  IF v_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submissão não encontrada');
  END IF;

  IF NOT (public.is_superadmin(auth.uid()) OR public.is_barbershop_admin_or_manager(auth.uid(), v_record.barbershop_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  IF v_record.status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pagamento já confirmado');
  END IF;

  UPDATE public.payment_confirmations
  SET status = 'accepted', confirmed_at = now(), confirmed_by = auth.uid()
  WHERE id = p_confirmation_id;

  UPDATE public.appointments
  SET status = 'confirmed', updated_at = now()
  WHERE id = v_record.appointment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 8. RPC: admin rejects payment
CREATE OR REPLACE FUNCTION public.admin_reject_payment(
  p_confirmation_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.payment_confirmations
  WHERE id = p_confirmation_id;

  IF v_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submissão não encontrada');
  END IF;

  IF NOT (public.is_superadmin(auth.uid()) OR public.is_barbershop_admin_or_manager(auth.uid(), v_record.barbershop_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE public.payment_confirmations
  SET status = 'rejected', reject_reason = p_reason, confirmed_at = now(), confirmed_by = auth.uid()
  WHERE id = p_confirmation_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
