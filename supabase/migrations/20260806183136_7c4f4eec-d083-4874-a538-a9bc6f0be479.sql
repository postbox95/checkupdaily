ALTER TABLE public.lab_chains
  ADD COLUMN IF NOT EXISTS default_opens_at text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS default_closes_at text NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS default_is_24_hours boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_closed_days smallint[] NOT NULL DEFAULT '{}'::smallint[];