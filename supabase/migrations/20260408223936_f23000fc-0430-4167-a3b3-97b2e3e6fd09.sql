
-- 1. CRITICAL: Remove privilege escalation policy on user_roles
DROP POLICY IF EXISTS "Users can insert admin role for themselves" ON public.user_roles;

-- 2. Fix barber_services cross-tenant: scope to barbershop
DROP POLICY IF EXISTS "Admins can manage barber services" ON public.barber_services;

CREATE POLICY "Admins can manage own barbershop barber_services"
ON public.barber_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbers b
    WHERE b.id = barber_services.barber_id
    AND public.is_barbershop_admin_or_manager(auth.uid(), b.barbershop_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbers b
    WHERE b.id = barber_services.barber_id
    AND public.is_barbershop_admin_or_manager(auth.uid(), b.barbershop_id)
  )
);

-- Superadmin can manage all barber_services
CREATE POLICY "Superadmin can manage all barber_services"
ON public.barber_services
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- 3. Remove insecure anonymous upload on logos bucket
DROP POLICY IF EXISTS "Anyone can upload logos" ON storage.objects;

-- 4. Fix gallery bucket - require ownership
DROP POLICY IF EXISTS "gallery_insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery_update" ON storage.objects;
DROP POLICY IF EXISTS "gallery_delete" ON storage.objects;

CREATE POLICY "gallery_insert" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "gallery_update" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "gallery_delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- 5. Fix videos bucket - require ownership
DROP POLICY IF EXISTS "videos_insert" ON storage.objects;
DROP POLICY IF EXISTS "videos_update" ON storage.objects;
DROP POLICY IF EXISTS "videos_delete" ON storage.objects;

CREATE POLICY "videos_insert" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "videos_update" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "videos_delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- 6. Fix covers bucket - require ownership
DROP POLICY IF EXISTS "covers_insert" ON storage.objects;
DROP POLICY IF EXISTS "covers_update" ON storage.objects;
DROP POLICY IF EXISTS "covers_delete" ON storage.objects;

CREATE POLICY "covers_insert" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "covers_update" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "covers_delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers'
  AND auth.uid() IS NOT NULL
  AND public.is_admin_or_manager_of_barbershop(auth.uid(), (storage.foldername(name))[1]::uuid)
);
