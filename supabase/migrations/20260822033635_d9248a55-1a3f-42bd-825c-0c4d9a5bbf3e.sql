CREATE OR REPLACE FUNCTION public.seo_touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.seo_meta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('global','page','test','center','chain','category')),
  entity_key TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en','bn')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_key, lang)
);
GRANT SELECT ON public.seo_meta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_meta TO authenticated;
GRANT ALL ON public.seo_meta TO service_role;
ALTER TABLE public.seo_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_meta public read" ON public.seo_meta FOR SELECT USING (true);
CREATE POLICY "seo_meta admin write" ON public.seo_meta FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.seo_redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301,302,307,308)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_path <> to_path)
);
GRANT SELECT ON public.seo_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_redirects TO authenticated;
GRANT ALL ON public.seo_redirects TO service_role;
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_redirects public read" ON public.seo_redirects FOR SELECT USING (is_active);
CREATE POLICY "seo_redirects admin write" ON public.seo_redirects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER seo_meta_updated_at BEFORE UPDATE ON public.seo_meta
  FOR EACH ROW EXECUTE FUNCTION public.seo_touch_updated_at();
CREATE TRIGGER seo_redirects_updated_at BEFORE UPDATE ON public.seo_redirects
  FOR EACH ROW EXECUTE FUNCTION public.seo_touch_updated_at();

UPDATE public.site_settings SET value = jsonb_set(value, '{siteName}', '"MyTestReport"') WHERE key = 'general';