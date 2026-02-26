
-- 1. Add 'affiliate' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';

-- 2. Evolve affiliates_agenda table with new columns
ALTER TABLE public.affiliates_agenda
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS commission_percentage numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS total_earnings numeric NOT NULL DEFAULT 0;

-- 3. Create affiliate_referrals table
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates_agenda(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'converted', 'paid')),
  commission_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS on affiliate_referrals
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for affiliate_referrals
CREATE POLICY "Block anonymous select on affiliate_referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (false);

CREATE POLICY "Superadmin can manage all affiliate_referrals"
  ON public.affiliate_referrals FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Affiliates can view own referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates_agenda a
      WHERE a.id = affiliate_referrals.affiliate_id
        AND a.user_id = auth.uid()
    )
  );

-- 6. RLS policy for affiliates to view own record
CREATE POLICY "Affiliates can view own record"
  ON public.affiliates_agenda FOR SELECT
  USING (user_id = auth.uid());

-- 7. Create function to check if user is affiliate
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates_agenda
    WHERE user_id = _user_id AND active = true
  )
$$;

-- 8. Trigger for updated_at on affiliate_referrals
CREATE TRIGGER update_affiliate_referrals_updated_at
  BEFORE UPDATE ON public.affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
