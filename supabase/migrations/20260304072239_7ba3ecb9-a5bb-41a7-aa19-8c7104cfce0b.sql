-- =============================================
-- Wire notifications into existing RPCs
-- =============================================

-- 1. Update create_public_appointment to create notification when payment_required
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_barbershop_id uuid, p_barber_id uuid, p_service_id uuid,
  p_client_name text, p_client_phone text,
  p_appointment_date date, p_appointment_time time, p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_appointment_id uuid;
  v_barbershop RECORD;
  v_barber_active boolean;
  v_service RECORD;
  v_slot_available boolean;
  v_notif_body text;
BEGIN
  -- Validate barbershop
  SELECT * INTO v_barbershop
  FROM barbershops
  WHERE id = p_barbershop_id AND active = true AND approval_status = 'approved';

  IF v_barbershop IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Estabelecimento não encontrado ou inativo');
  END IF;

  -- Validate barber
  SELECT EXISTS (
    SELECT 1 FROM barbers
    WHERE id = p_barber_id AND barbershop_id = p_barbershop_id AND active = true
  ) INTO v_barber_active;

  IF NOT v_barber_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profissional não encontrado ou inativo');
  END IF;

  -- Validate service
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND barbershop_id = p_barbershop_id AND active = true;

  IF v_service IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Serviço não encontrado ou inativo');
  END IF;

  -- Validate slot
  SELECT NOT EXISTS (
    SELECT 1 FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.barber_id = p_barber_id
      AND a.appointment_date = p_appointment_date
      AND a.status NOT IN ('cancelled')
      AND (
        (p_appointment_time >= a.appointment_time 
         AND p_appointment_time < a.appointment_time + (s.duration || ' minutes')::interval)
        OR
        (a.appointment_time >= p_appointment_time 
         AND a.appointment_time < p_appointment_time + (v_service.duration || ' minutes')::interval)
      )
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Horário não disponível');
  END IF;

  IF p_appointment_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data deve ser futura');
  END IF;

  IF p_client_name IS NULL OR trim(p_client_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome do cliente é obrigatório');
  END IF;

  IF p_client_phone IS NULL OR trim(p_client_phone) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Telefone do cliente é obrigatório');
  END IF;

  INSERT INTO appointments (
    barbershop_id, barber_id, service_id, client_name, client_phone,
    appointment_date, appointment_time, notes, status
  ) VALUES (
    p_barbershop_id, p_barber_id, p_service_id,
    trim(p_client_name), trim(p_client_phone),
    p_appointment_date, p_appointment_time, p_notes, 'pending'
  )
  RETURNING id INTO v_appointment_id;

  -- Create notification if payment required
  IF v_barbershop.payment_required THEN
    v_notif_body := 'Cliente: ' || trim(p_client_name) || E'\n'
      || 'Serviço: ' || v_service.name || E'\n'
      || 'Data: ' || to_char(p_appointment_date, 'DD/MM/YYYY') || E'\n'
      || 'Hora: ' || to_char(p_appointment_time, 'HH24:MI') || E'\n'
      || 'Valor: ' || v_service.price || ' ' || v_barbershop.currency_code;

    PERFORM public.create_owner_notification(
      p_barbershop_id,
      v_appointment_id,
      'NEW_PENDING',
      'Novo agendamento — verifique o pagamento',
      v_notif_body,
      jsonb_build_object(
        'client_name', trim(p_client_name),
        'service_name', v_service.name,
        'price', v_service.price,
        'currency', v_barbershop.currency_code,
        'date', to_char(p_appointment_date, 'DD/MM/YYYY'),
        'time', to_char(p_appointment_time, 'HH24:MI')
      )
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Update submit_payment_confirmation to create CODE_SUBMITTED notification
CREATE OR REPLACE FUNCTION public.submit_payment_confirmation(
  p_appointment_id uuid, p_barbershop_id uuid,
  p_method_id text, p_method_label text, p_country text,
  p_payer_phone text, p_amount numeric, p_raw_text text,
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
  v_service_name text;
  v_barber_name text;
  v_barbershop RECORD;
  v_notif_body text;
BEGIN
  SELECT * INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id AND barbershop_id = p_barbershop_id;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = p_barbershop_id AND payment_required = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pagamento não é obrigatório para este negócio');
  END IF;

  v_extracted_code := public.extract_payment_code(p_raw_text, p_code_rules);

  IF v_extracted_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido. Cole o SMS completo ou verifique o código.', 'code', 'INVALID_CODE');
  END IF;

  SELECT * INTO v_existing
  FROM public.payment_confirmations
  WHERE transaction_code = v_extracted_code;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código já foi usado. Use o código do seu pagamento atual.', 'code', 'CODE_REUSED');
  END IF;

  SELECT * INTO v_existing
  FROM public.payment_confirmations
  WHERE appointment_id = p_appointment_id AND status != 'rejected';

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Já existe uma submissão de pagamento para este agendamento.', 'code', 'ALREADY_SUBMITTED');
  END IF;

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

  -- Create CODE_SUBMITTED notification
  SELECT name INTO v_service_name FROM public.services WHERE id = v_appointment.service_id;
  SELECT name INTO v_barber_name FROM public.barbers WHERE id = v_appointment.barber_id;
  SELECT * INTO v_barbershop FROM public.barbershops WHERE id = p_barbershop_id;

  v_notif_body := 'Cliente: ' || v_appointment.client_name || E'\n'
    || 'Serviço: ' || COALESCE(v_service_name, '—') || E'\n'
    || 'Profissional: ' || COALESCE(v_barber_name, '—') || E'\n'
    || 'Data: ' || to_char(v_appointment.appointment_date, 'DD/MM/YYYY') || E'\n'
    || 'Hora: ' || to_char(v_appointment.appointment_time, 'HH24:MI') || E'\n'
    || 'Valor: ' || p_amount || ' ' || COALESCE(v_barbershop.currency_code, 'MZN') || E'\n'
    || 'Método: ' || p_method_label || E'\n'
    || 'Código: ' || v_extracted_code;

  PERFORM public.create_owner_notification(
    p_barbershop_id,
    p_appointment_id,
    'CODE_SUBMITTED',
    'Código de pagamento submetido — confirme no painel',
    v_notif_body,
    jsonb_build_object(
      'client_name', v_appointment.client_name,
      'service_name', COALESCE(v_service_name, ''),
      'professional_name', COALESCE(v_barber_name, ''),
      'price', p_amount,
      'currency', COALESCE(v_barbershop.currency_code, 'MZN'),
      'date', to_char(v_appointment.appointment_date, 'DD/MM/YYYY'),
      'time', to_char(v_appointment.appointment_time, 'HH24:MI'),
      'method_label', p_method_label,
      'extracted_code', v_extracted_code
    )
  );

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
