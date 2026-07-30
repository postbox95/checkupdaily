
-- 1. Lab chains
CREATE TABLE public.lab_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text NOT NULL DEFAULT '',
  default_home_sample_available boolean NOT NULL DEFAULT true,
  default_sample_collection_fee integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lab_chains TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_chains TO authenticated;
GRANT ALL ON public.lab_chains TO service_role;
ALTER TABLE public.lab_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chains public read" ON public.lab_chains FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chains admin write" ON public.lab_chains FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER lab_chains_touch BEFORE UPDATE ON public.lab_chains
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Chain-level price template
CREATE TABLE public.chain_test_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_chain_id uuid NOT NULL REFERENCES public.lab_chains(id) ON DELETE CASCADE,
  medical_test_id uuid NOT NULL REFERENCES public.medical_tests(id) ON DELETE CASCADE,
  price integer NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'none',
  discount_value numeric NOT NULL DEFAULT 0,
  notes text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_chain_id, medical_test_id)
);
GRANT SELECT ON public.chain_test_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chain_test_prices TO authenticated;
GRANT ALL ON public.chain_test_prices TO service_role;
ALTER TABLE public.chain_test_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chain prices public read" ON public.chain_test_prices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chain prices admin write" ON public.chain_test_prices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER chain_test_prices_touch BEFORE UPDATE ON public.chain_test_prices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Branch inheritance columns
ALTER TABLE public.diagnostic_centers
  ADD COLUMN lab_chain_id uuid REFERENCES public.lab_chains(id) ON DELETE SET NULL,
  ADD COLUMN sample_collection_fee_override integer,
  ADD COLUMN home_sample_override boolean;

-- 4. Test-specific consumable fee + government rate
ALTER TABLE public.medical_tests
  ADD COLUMN consumable_fee integer NOT NULL DEFAULT 0,
  ADD COLUMN is_government_rate boolean NOT NULL DEFAULT false;

-- 5. Discount type on branch prices
ALTER TABLE public.test_prices
  ADD COLUMN discount_type text NOT NULL DEFAULT 'none',
  ADD COLUMN discount_value numeric NOT NULL DEFAULT 0;

UPDATE public.test_prices
SET discount_type = 'amount',
    discount_value = GREATEST(price - discounted_price, 0)
WHERE discounted_price IS NOT NULL AND discounted_price < price;

-- 6. Backfill chains from existing branch names
INSERT INTO public.lab_chains (slug, name, default_home_sample_available, default_sample_collection_fee, sort_order)
SELECT
  lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) AS slug,
  name,
  bool_or(home_sample_available),
  (percentile_disc(0.5) WITHIN GROUP (ORDER BY sample_collection_fee))::int,
  min(sort_order)
FROM public.diagnostic_centers
GROUP BY name;

UPDATE public.diagnostic_centers c
SET lab_chain_id = lc.id
FROM public.lab_chains lc
WHERE lc.name = c.name;

-- branch overrides only where they differ from the chain default
UPDATE public.diagnostic_centers c
SET sample_collection_fee_override =
      CASE WHEN c.sample_collection_fee <> lc.default_sample_collection_fee
           THEN c.sample_collection_fee END,
    home_sample_override =
      CASE WHEN c.home_sample_available <> lc.default_home_sample_available
           THEN c.home_sample_available END
FROM public.lab_chains lc
WHERE lc.id = c.lab_chain_id;

-- 7. Backfill chain price template from existing branch prices (median price per chain+test)
INSERT INTO public.chain_test_prices (lab_chain_id, medical_test_id, price, discount_type, discount_value, is_available)
SELECT c.lab_chain_id,
       tp.medical_test_id,
       (percentile_disc(0.5) WITHIN GROUP (ORDER BY tp.price))::int,
       'none',
       0,
       bool_or(tp.is_available)
FROM public.test_prices tp
JOIN public.diagnostic_centers c ON c.id = tp.diagnostic_center_id
WHERE c.lab_chain_id IS NOT NULL
GROUP BY c.lab_chain_id, tp.medical_test_id;

-- branch rows that match the template exactly become inherited (row removed)
DELETE FROM public.test_prices tp
USING public.diagnostic_centers c, public.chain_test_prices ct
WHERE c.id = tp.diagnostic_center_id
  AND ct.lab_chain_id = c.lab_chain_id
  AND ct.medical_test_id = tp.medical_test_id
  AND tp.price = ct.price
  AND tp.discounted_price IS NULL
  AND tp.is_available = ct.is_available
  AND (tp.notes IS NULL OR tp.notes = '');
