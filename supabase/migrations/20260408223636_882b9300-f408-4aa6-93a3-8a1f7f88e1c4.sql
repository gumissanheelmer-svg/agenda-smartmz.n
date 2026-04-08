
-- 1. Replace get_public_barbershop to EXCLUDE mpesa_number and emola_number
CREATE OR REPLACE FUNCTION public.get_public_barbershop(p_slug text)
RETURNS TABLE(
  id uuid, slug text, name text, logo_url text, primary_color text, secondary_color text,
  background_color text, text_color text, opening_time text, closing_time text,
  business_type text, background_image_url text, background_overlay_level text,
  mpesa_number text, emola_number text,
  payment_methods_enabled text[], whatsapp_number text, payment_required boolean,
  prep_buffer_minutes integer, cleanup_buffer_minutes integer, slot_interval_minutes integer,
  address text, latitude double precision, longitude double precision,
  cover_image_url text, city text, neighborhood text, location_name text,
  gallery_images text[], video_url text, maps_raw_link text, gallery_videos text[],
  media_featured_url text, media_featured_type text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    b.id, b.slug, b.name, b.logo_url,
    b.primary_color, b.secondary_color, b.background_color, b.text_color,
    b.opening_time::text, b.closing_time::text, b.business_type,
    b.background_image_url, b.background_overlay_level,
    -- Return NULL for payment numbers in public context
    NULL::text AS mpesa_number,
    NULL::text AS emola_number,
    b.payment_methods_enabled,
    b.whatsapp_number, b.payment_required,
    b.prep_buffer_minutes, b.cleanup_buffer_minutes, b.slot_interval_minutes,
    b.address, b.latitude, b.longitude,
    b.cover_image_url, b.city, b.neighborhood, b.location_name,
    b.gallery_images, b.video_url,
    b.maps_raw_link, b.gallery_videos,
    b.media_featured_url, b.media_featured_type
  FROM barbershops b
  WHERE b.slug = p_slug AND b.active = true AND b.approval_status = 'approved';
$$;

-- 2. Create secure RPC to get payment numbers only with a valid appointment
CREATE OR REPLACE FUNCTION public.get_payment_numbers_for_appointment(p_appointment_id uuid)
RETURNS TABLE(mpesa_number text, emola_number text, payment_methods_enabled text[], currency_code text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_barbershop_id uuid;
  v_status text;
BEGIN
  -- Get the appointment and validate it exists and is in a payable state
  SELECT a.barbershop_id, a.status INTO v_barbershop_id, v_status
  FROM public.appointments a
  WHERE a.id = p_appointment_id;

  IF v_barbershop_id IS NULL THEN
    RETURN;
  END IF;

  -- Only return payment numbers for appointments in payable states
  IF v_status NOT IN ('pending', 'awaiting_payment') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.mpesa_number::text,
    b.emola_number::text,
    b.payment_methods_enabled,
    b.currency_code
  FROM public.barbershops b
  WHERE b.id = v_barbershop_id
    AND b.payment_required = true;
END;
$$;

-- 3. Create admin-only RPC for full payment settings
CREATE OR REPLACE FUNCTION public.get_payment_settings_for_admin(p_barbershop_id uuid)
RETURNS TABLE(
  mpesa_number text, emola_number text, payment_methods_enabled text[],
  payment_required boolean, payment_methods jsonb, currency_code text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Only admin, manager, or superadmin can access
  IF NOT (
    public.is_superadmin(auth.uid())
    OR public.is_barbershop_admin(auth.uid(), p_barbershop_id)
    OR public.is_barbershop_manager(auth.uid(), p_barbershop_id)
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    b.mpesa_number::text,
    b.emola_number::text,
    b.payment_methods_enabled,
    b.payment_required,
    b.payment_methods,
    b.currency_code
  FROM public.barbershops b
  WHERE b.id = p_barbershop_id;
END;
$$;
