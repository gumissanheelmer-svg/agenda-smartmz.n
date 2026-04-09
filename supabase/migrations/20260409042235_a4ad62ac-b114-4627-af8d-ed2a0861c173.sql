
-- Create plans table
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MZN',
  country_code text NOT NULL DEFAULT 'MZ',
  max_professionals integer NOT NULL DEFAULT 1,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(key, country_code)
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
USING (active = true);

-- Superadmin can manage plans
CREATE POLICY "Superadmin can manage all plans"
ON public.plans FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Add plan_id to barbershops
ALTER TABLE public.barbershops
ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Seed Mozambique plans (MZN)
INSERT INTO public.plans (key, name, price, yearly_price, currency, country_code, max_professionals, features, badge, is_default) VALUES
('basic', 'Básico', 197, 1970, 'MZN', 'MZ', 1, 
 '["1 profissional", "Agendamento online 24h", "Link de agendamento", "Gestão de serviços", "Confirmações automáticas"]'::jsonb, 
 NULL, true),
('pro', 'Pro', 497, 4970, 'MZN', 'MZ', 5, 
 '["Até 5 profissionais", "Tudo do Básico", "Recibos digitais", "Gestão de clientes", "Google Maps integrado", "Relatórios avançados", "Suporte prioritário"]'::jsonb, 
 'Recomendado', false),
('premium', 'Premium', 797, 7970, 'MZN', 'MZ', -1, 
 '["Profissionais ilimitados", "Tudo do Pro", "Gestão de equipa completa", "Funcionalidades premium", "Suporte VIP"]'::jsonb, 
 NULL, false);

-- Seed International plans (USD)
INSERT INTO public.plans (key, name, price, yearly_price, currency, country_code, max_professionals, features, badge, is_default) VALUES
('basic', 'Basic', 4.99, 49.90, 'USD', 'INTL', 1, 
 '["1 professional", "24/7 online booking", "Booking link", "Service management", "Auto-confirmations"]'::jsonb, 
 NULL, true),
('pro', 'Pro', 9.99, 99.90, 'USD', 'INTL', 5, 
 '["Up to 5 professionals", "Everything in Basic", "Digital receipts", "Client management", "Google Maps integration", "Advanced reports", "Priority support"]'::jsonb, 
 'Recommended', false),
('premium', 'Premium', 14.99, 149.90, 'USD', 'INTL', -1, 
 '["Unlimited professionals", "Everything in Pro", "Full team management", "Premium features", "VIP support"]'::jsonb, 
 NULL, false);

-- Function to check professional limit
CREATE OR REPLACE FUNCTION public.check_professional_limit(p_barbershop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan RECORD;
  v_current_count integer;
  v_max integer;
BEGIN
  -- Get plan for this barbershop
  SELECT p.* INTO v_plan
  FROM public.plans p
  JOIN public.barbershops b ON b.plan_id = p.id
  WHERE b.id = p_barbershop_id;

  -- No plan = no limit (legacy/free)
  IF v_plan IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'current', 0, 'max', -1, 'plan_name', 'Sem plano');
  END IF;

  v_max := v_plan.max_professionals;

  -- -1 means unlimited
  IF v_max = -1 THEN
    SELECT COUNT(*) INTO v_current_count FROM public.barbers WHERE barbershop_id = p_barbershop_id AND active = true;
    RETURN jsonb_build_object('allowed', true, 'current', v_current_count, 'max', -1, 'plan_name', v_plan.name);
  END IF;

  -- Count active professionals
  SELECT COUNT(*) INTO v_current_count
  FROM public.barbers
  WHERE barbershop_id = p_barbershop_id AND active = true;

  RETURN jsonb_build_object(
    'allowed', v_current_count < v_max,
    'current', v_current_count,
    'max', v_max,
    'plan_name', v_plan.name
  );
END;
$$;
