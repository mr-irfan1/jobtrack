-- ============================================================================
-- Migration: 20260912000002_centralized_jobs_schema.sql
-- Description: Centralized normalized jobs catalog, provider sources,
--              and ingestion run tracking for JobTrack.
-- Security: Row Level Security (RLS) enabled on all tables. Public read
--           allowed for active jobs; all write/mutation operations restricted
--           to server-side service role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Job Sources Table
-- Tracks supported job providers (Remotive, Greenhouse, Adzuna, etc.) and health
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 360,
  last_run_at TIMESTAMPTZ NULL,
  last_success_at TIMESTAMPTZ NULL,
  last_error TEXT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_job_sources_updated_at ON public.job_sources;
CREATE TRIGGER tr_job_sources_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_sources'
      AND policyname = 'Anyone can view enabled job sources'
  ) THEN
    CREATE POLICY "Anyone can view enabled job sources"
      ON public.job_sources FOR SELECT
      USING (is_enabled = true);
  END IF;
END $$;

-- Seed known default provider sources
INSERT INTO public.job_sources (id, name, is_enabled, fetch_interval_minutes, config)
VALUES
  ('remotive', 'Remotive', true, 360, '{"api_url": "https://remotive.com/api/remote-jobs"}'::jsonb),
  ('greenhouse', 'Greenhouse', true, 360, '{"boards": []}'::jsonb),
  ('adzuna', 'Adzuna', true, 360, '{"country": "us"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Centralized Normalized Jobs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider / Source Identity
  source TEXT NOT NULL REFERENCES public.job_sources(id) ON UPDATE CASCADE,
  source_job_id TEXT NOT NULL,
  raw_source_id TEXT NULL,
  source_name TEXT NOT NULL DEFAULT 'External',
  source_url TEXT NULL,
  apply_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  
  -- Job Content
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  workplace_type TEXT NOT NULL CHECK (workplace_type IN ('Remote', 'Hybrid', 'On-site')) DEFAULT 'Remote',
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Other')) DEFAULT 'Full-time',
  category TEXT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  
  -- Compensation
  salary_raw TEXT NULL,
  salary_min NUMERIC NULL CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max NUMERIC NULL CHECK (salary_max IS NULL OR salary_max >= 0),
  salary_currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Search & Discovery (Normalized for performant case-insensitive matching)
  normalized_title TEXT NOT NULL DEFAULT '',
  normalized_company TEXT NOT NULL DEFAULT '',
  normalized_location TEXT NOT NULL DEFAULT '',
  
  -- Extensibility
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Lifecycle & Timestamps
  is_active BOOLEAN NOT NULL DEFAULT true,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Uniqueness Constraints
  CONSTRAINT uq_jobs_source_job_id UNIQUE (source, source_job_id),
  CONSTRAINT uq_jobs_canonical_url UNIQUE (canonical_url)
);

-- Search & Discovery Auto-normalization Trigger Function
CREATE OR REPLACE FUNCTION public.handle_jobs_normalization()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_title = lower(trim(NEW.title));
  NEW.normalized_company = lower(trim(NEW.company));
  NEW.normalized_location = lower(trim(NEW.location));
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_jobs_normalization ON public.jobs;
CREATE TRIGGER tr_jobs_normalization
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_jobs_normalization();

-- Core performance indexes for search, feed filtering, and lifecycle management
CREATE INDEX IF NOT EXISTS idx_jobs_feed_active_posted ON public.jobs (is_active, posted_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs (source);
CREATE INDEX IF NOT EXISTS idx_jobs_workplace ON public.jobs (workplace_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_norm_company ON public.jobs (normalized_company) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_norm_title ON public.jobs (normalized_title) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_norm_location ON public.jobs (normalized_location) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON public.jobs USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen ON public.jobs (last_seen_at) WHERE is_active = true;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
      AND policyname = 'Anyone can view active jobs'
  ) THEN
    CREATE POLICY "Anyone can view active jobs"
      ON public.jobs FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Ingestion Runs Table
-- Tracks execution status, counts, and health of provider ingestion sweeps
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL REFERENCES public.job_sources(id) ON UPDATE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')) DEFAULT 'started',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  fetched_count INTEGER NOT NULL DEFAULT 0 CHECK (fetched_count >= 0),
  inserted_count INTEGER NOT NULL DEFAULT 0 CHECK (inserted_count >= 0),
  updated_count INTEGER NOT NULL DEFAULT 0 CHECK (updated_count >= 0),
  deduplicated_count INTEGER NOT NULL DEFAULT 0 CHECK (deduplicated_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  error_message TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source_started
  ON public.ingestion_runs (source, started_at DESC);

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- Note on ingestion_runs RLS:
-- Ingestion run records contain server execution metrics and error messages.
-- By enabling RLS without public SELECT/INSERT/UPDATE/DELETE policies, only
-- the service_role key (Edge Functions, cron jobs, server admin) can read or write.
