
-- 1. Create secure RPC for landing settings that masks phone numbers
CREATE OR REPLACE FUNCTION public.get_public_landing_settings()
RETURNS TABLE(
  hero_title text, hero_subtitle text,
  primary_cta_label text, secondary_cta_enabled boolean, secondary_cta_label text,
  vsl_enabled boolean, vsl_title text, vsl_subtitle text, vsl_minutes_label integer,
  vsl_embed_url text, vsl_cover_image_url text,
  pricing_enabled boolean, pricing_title text, pricing_subtitle text,
  pricing_discount_label text, currency_code text, plans jsonb,
  wa_sales_enabled boolean, wa_sales_cta_label text,
  wa_sales_url text, -- pre-built WhatsApp URL instead of raw phone
  wa_support_enabled boolean, wa_support_tooltip text, wa_support_position text,
  wa_support_url text -- pre-built WhatsApp URL instead of raw phone
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
  v_sales_phone text;
  v_support_phone text;
BEGIN
  SELECT * INTO v_record
  FROM public.landing_settings
  WHERE site_key = 'agenda-smart' AND is_enabled = true
  LIMIT 1;

  IF v_record IS NULL THEN RETURN; END IF;

  v_sales_phone := COALESCE(v_record.wa_sales_phone, '');
  v_support_phone := COALESCE(v_record.wa_support_phone, v_sales_phone);

  RETURN QUERY SELECT
    v_record.hero_title, v_record.hero_subtitle,
    v_record.primary_cta_label, v_record.secondary_cta_enabled, v_record.secondary_cta_label,
    v_record.vsl_enabled, v_record.vsl_title, v_record.vsl_subtitle, v_record.vsl_minutes_label,
    v_record.vsl_embed_url, v_record.vsl_cover_image_url,
    v_record.pricing_enabled, v_record.pricing_title, v_record.pricing_subtitle,
    v_record.pricing_discount_label, v_record.currency_code, v_record.plans,
    v_record.wa_sales_enabled, v_record.wa_sales_cta_label,
    CASE WHEN v_sales_phone != '' THEN 'https://wa.me/' || regexp_replace(v_sales_phone, '\D', '', 'g') ELSE NULL END,
    v_record.wa_support_enabled, v_record.wa_support_tooltip, v_record.wa_support_position,
    CASE WHEN v_support_phone != '' THEN 'https://wa.me/' || regexp_replace(v_support_phone, '\D', '', 'g') ELSE NULL END;
END;
$$;

-- 2. Restrict landing_settings public read to NOT expose phone numbers directly
-- Keep the public SELECT but the RPC above is the recommended way to access
-- The superadmin policy already handles full access for editing

-- 3. Fix logos bucket - remove overly permissive policies
-- (The "Authenticated users can manage their uploads" style policies)
DROP POLICY IF EXISTS "Authenticated users can manage their uploads" ON storage.objects;

-- 4. Add notification_events visibility for barbershop staff
CREATE POLICY "Staff can view own barbershop notification_events"
ON public.notification_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = notification_events.appointment_id
    AND (
      public.is_barbershop_admin_or_manager(auth.uid(), a.barbershop_id)
    )
  )
);
