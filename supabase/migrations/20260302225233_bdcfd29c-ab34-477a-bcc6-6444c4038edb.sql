-- Expand check constraint to include estetica and tattoo_studio
ALTER TABLE public.barbershops DROP CONSTRAINT barbershops_business_type_check;
ALTER TABLE public.barbershops ADD CONSTRAINT barbershops_business_type_check 
  CHECK (business_type = ANY (ARRAY['barbearia'::text, 'salao'::text, 'salao_barbearia'::text, 'estetica'::text, 'tattoo_studio'::text]));
