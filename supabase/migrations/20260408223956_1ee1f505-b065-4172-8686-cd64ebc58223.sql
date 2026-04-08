
-- Fix: Admins should only see roles within their own barbershop
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view roles in own barbershop"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
    AND ur.barbershop_id = user_roles.barbershop_id
  )
);
