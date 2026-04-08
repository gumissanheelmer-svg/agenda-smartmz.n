
-- Remove the recursive policy
DROP POLICY IF EXISTS "Admins can view roles in own barbershop" ON public.user_roles;

-- Create a security definer function to check barbershop membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_barbershop(_user_id uuid, _barbershop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND barbershop_id = _barbershop_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Re-create policy using the function
CREATE POLICY "Admins can view roles in own barbershop"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
);
