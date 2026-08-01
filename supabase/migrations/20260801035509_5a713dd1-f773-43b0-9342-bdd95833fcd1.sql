ALTER TABLE public.lab_chains
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pros text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cons text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_chain_id uuid NOT NULL REFERENCES public.lab_chains(id) ON DELETE CASCADE,
  diagnostic_center_id uuid REFERENCES public.diagnostic_centers(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL DEFAULT '',
  phone_number text NOT NULL,
  phone_verified_at timestamptz,
  billing_id text NOT NULL,
  rating integer NOT NULL,
  review_text text NOT NULL,
  test_name text,
  status text NOT NULL DEFAULT 'published',
  flagged_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_status_valid CHECK (status IN ('pending','published','flagged','deleted')),
  CONSTRAINT reviews_unique_customer UNIQUE (lab_chain_id, phone_number, billing_id)
);

CREATE INDEX reviews_chain_status_idx ON public.reviews (lab_chain_id, status, created_at DESC);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published reviews are public" ON public.reviews
  FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "admins manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER reviews_touch_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX phone_otps_phone_idx ON public.phone_otps (phone_number, created_at DESC);

GRANT ALL ON public.phone_otps TO service_role;

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;