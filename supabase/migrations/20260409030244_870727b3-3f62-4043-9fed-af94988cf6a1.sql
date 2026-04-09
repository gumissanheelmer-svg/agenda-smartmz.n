
-- Utility function to mask phone numbers
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_phone IS NULL OR length(p_phone) < 5 THEN '***'
    WHEN length(p_phone) <= 9 THEN
      left(p_phone, 2) || repeat('*', length(p_phone) - 5) || right(p_phone, 3)
    ELSE
      left(p_phone, 3) || repeat('*', length(p_phone) - 6) || right(p_phone, 3)
  END;
$$;

-- Secure RPC: get clients for a barbershop (aggregated from appointments)
-- Returns masked phones; full phone only via separate permission check
CREATE OR REPLACE FUNCTION public.get_clients_for_barbershop(p_barbershop_id uuid)
RETURNS TABLE(
  client_name text,
  client_phone_masked text,
  appointment_count bigint,
  last_appointment date
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admin, manager, or superadmin
  IF NOT (
    public.is_superadmin(auth.uid())
    OR public.is_barbershop_admin_or_manager(auth.uid(), p_barbershop_id)
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    a.client_name,
    public.mask_phone(a.client_phone) AS client_phone_masked,
    COUNT(*)::bigint AS appointment_count,
    MAX(a.appointment_date) AS last_appointment
  FROM public.appointments a
  WHERE a.barbershop_id = p_barbershop_id
  GROUP BY a.client_name, a.client_phone
  ORDER BY MAX(a.appointment_date) DESC;
END;
$$;
