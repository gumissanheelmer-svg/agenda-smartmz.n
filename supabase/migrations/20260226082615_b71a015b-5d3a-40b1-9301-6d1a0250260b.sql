
-- 1. Evolve affiliates_agenda table
ALTER TABLE public.affiliates_agenda
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS created_by_superadmin uuid NULL;

-- Add unique constraint on email (only if not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_agenda_email ON public.affiliates_agenda (email) WHERE email IS NOT NULL;

-- 2. Evolve affiliate_referrals table with extra fields
ALTER TABLE public.affiliate_referrals
  ADD COLUMN IF NOT EXISTS lead_phone text NULL,
  ADD COLUMN IF NOT EXISTS lead_name text NULL,
  ADD COLUMN IF NOT EXISTS country_code text NULL,
  ADD COLUMN IF NOT EXISTS notes text NULL;

-- 3. Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates_agenda(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  plan_id text NULL,
  amount_total numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  commission_currency text NOT NULL DEFAULT 'MZN',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Block anonymous
CREATE POLICY "Block anonymous select on affiliate_commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (false);

-- RLS: Superadmin full access
CREATE POLICY "Superadmin can manage all affiliate_commissions"
  ON public.affiliate_commissions FOR ALL
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- RLS: Affiliates can view own commissions
CREATE POLICY "Affiliates can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates_agenda a
      WHERE a.id = affiliate_commissions.affiliate_id
        AND a.user_id = auth.uid()
    )
  );

-- Add check constraint for status values
ALTER TABLE public.affiliate_commissions
  ADD CONSTRAINT chk_commission_status CHECK (status IN ('pending', 'approved', 'paid', 'rejected'));

-- Add constraint for affiliate status
ALTER TABLE public.affiliates_agenda
  ADD CONSTRAINT chk_affiliate_status CHECK (status IN ('active', 'inactive', 'suspended'));

-- Update existing records to have default status
UPDATE public.affiliates_agenda SET status = 'active' WHERE status IS NULL;
UPDATE public.affiliates_agenda SET status = CASE WHEN active = true THEN 'active' ELSE 'inactive' END;
