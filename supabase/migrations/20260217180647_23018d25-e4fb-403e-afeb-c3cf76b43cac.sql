
-- Create receipts table
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL,
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id),
  appointment_id uuid REFERENCES public.appointments(id),
  client_name text NOT NULL,
  service_name text NOT NULL,
  professional_name text NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('MPESA', 'EMOLA')),
  transaction_code text,
  issued_by uuid NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sequence for receipt numbers
CREATE SEQUENCE public.receipt_number_seq START 1;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.receipt_number := 'REC-' || LPAD(nextval('public.receipt_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_receipt_number
  BEFORE INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_receipt_number();

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin can manage receipts"
  ON public.receipts FOR ALL
  USING (is_barbershop_admin(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_admin(auth.uid(), barbershop_id));

CREATE POLICY "Manager can manage receipts"
  ON public.receipts FOR ALL
  USING (is_barbershop_manager(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_manager(auth.uid(), barbershop_id));

CREATE POLICY "Superadmin can manage all receipts"
  ON public.receipts FOR ALL
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Block anonymous select on receipts"
  ON public.receipts FOR SELECT
  USING (false);
