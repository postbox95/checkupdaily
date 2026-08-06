ALTER TABLE public.diagnostic_centers
  ADD COLUMN IF NOT EXISTS opens_at text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS closes_at text NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS is_24_hours boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS closed_days smallint[] NOT NULL DEFAULT '{}'::smallint[];