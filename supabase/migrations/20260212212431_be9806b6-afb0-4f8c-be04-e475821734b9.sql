
-- Add new columns
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text;

-- Must drop first to change return type
DROP FUNCTION IF EXISTS public.get_public_barbershop(text);

CREATE FUNCTION public.get_public_barbershop(p_slug text)
RETURNS TABLE(
  id uuid, slug text, name text, logo_url text,
  primary_color text, secondary_color text, background_color text, text_color text,
  opening_time text, closing_time text, business_type text,
  background_image_url text, background_overlay_level text,
  mpesa_number text, emola_number text, payment_methods_enabled text[],
  whatsapp_number text, payment_required boolean,
  prep_buffer_minutes integer, cleanup_buffer_minutes integer, slot_interval_minutes integer,
  address text, latitude double precision, longitude double precision, cover_image_url text,
  city text, neighborhood text, location_name text, gallery_images text[], video_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.slug, b.name, b.logo_url,
    b.primary_color, b.secondary_color, b.background_color, b.text_color,
    b.opening_time::text, b.closing_time::text, b.business_type,
    b.background_image_url, b.background_overlay_level,
    b.mpesa_number::text, b.emola_number::text, b.payment_methods_enabled,
    b.whatsapp_number, b.payment_required,
    b.prep_buffer_minutes, b.cleanup_buffer_minutes, b.slot_interval_minutes,
    b.address, b.latitude, b.longitude, b.cover_image_url,
    b.city, b.neighborhood, b.location_name, b.gallery_images, b.video_url
  FROM barbershops b
  WHERE b.slug = p_slug AND b.active = true AND b.approval_status = 'approved';
$$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;

-- Gallery policies
CREATE POLICY "gallery_select" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "gallery_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "gallery_update" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "gallery_delete" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

-- Videos policies
CREATE POLICY "videos_select" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "videos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "videos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "videos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- Covers policies
CREATE POLICY "covers_select" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "covers_update" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "covers_delete" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
