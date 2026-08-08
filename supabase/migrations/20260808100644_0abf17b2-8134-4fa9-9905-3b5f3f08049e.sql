CREATE TABLE public.ad_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placement text NOT NULL DEFAULT 'search_top',
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ad_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_banners TO authenticated;
GRANT ALL ON public.ad_banners TO service_role;

ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads public read live" ON public.ad_banners
FOR SELECT TO anon, authenticated
USING (
  is_active
  AND (starts_at IS NULL OR starts_at <= now())
  AND (expires_at IS NULL OR expires_at > now())
);

CREATE POLICY "ads admin write" ON public.ad_banners
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ad_banners_touch BEFORE UPDATE ON public.ad_banners
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX ad_banners_placement_idx ON public.ad_banners (placement, sort_order);