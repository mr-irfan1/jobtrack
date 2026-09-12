-- ============================================================================
-- Migration: 20260912000001_production_backend_schema.sql
-- Description: Production backend schema for JobTrack.
-- Features: Profiles, Resumes + Storage, Applications (with resume_id), Follow-ups,
--           Saved Jobs, Cover Letters, Job Alerts, and Interview Prep Checklists.
-- Security: Row Level Security (RLS) enabled on all tables; auth.uid() ownership.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Reusable Helper for updating `updated_at` timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  location TEXT,
  bio TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  read_notification_ids TEXT[] DEFAULT '{}'::text[],
  dismissed_notification_ids TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON public.profiles FOR DELETE
      USING (auth.uid() = id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-provision profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. Resumes Table & Private Storage Bucket
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'doc', 'docx', 'other')),
  file_size INTEGER NOT NULL CHECK (file_size >= 0),
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_primary ON public.resumes(user_id, is_primary);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resumes' AND policyname = 'Users can view own resumes'
  ) THEN
    CREATE POLICY "Users can view own resumes"
      ON public.resumes FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resumes' AND policyname = 'Users can insert own resumes'
  ) THEN
    CREATE POLICY "Users can insert own resumes"
      ON public.resumes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resumes' AND policyname = 'Users can update own resumes'
  ) THEN
    CREATE POLICY "Users can update own resumes"
      ON public.resumes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resumes' AND policyname = 'Users can delete own resumes'
  ) THEN
    CREATE POLICY "Users can delete own resumes"
      ON public.resumes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_resumes_updated_at ON public.resumes;
CREATE TRIGGER tr_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Supabase Storage: Private resumes bucket setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Storage Object RLS for private resumes bucket (User path isolation: {user_id}/*)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can access own resume files'
  ) THEN
    CREATE POLICY "Users can access own resume files"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'resumes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own resume files'
  ) THEN
    CREATE POLICY "Users can upload own resume files"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'resumes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own resume files'
  ) THEN
    CREATE POLICY "Users can update own resume files"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'resumes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'resumes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own resume files'
  ) THEN
    CREATE POLICY "Users can delete own resume files"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'resumes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Applications Table (Ensure existing schema has resume_id & indexes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  company TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  job_url TEXT NOT NULL DEFAULT '',
  application_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected')),
  notes TEXT NOT NULL DEFAULT '',
  interview_date DATE NULL,
  interview_time TIME NULL,
  interview_type TEXT NULL,
  meeting_link TEXT NULL,
  resume_id UUID NULL REFERENCES public.resumes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure resume_id column exists if table was created in an earlier step
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = 'resume_id'
  ) THEN
    ALTER TABLE public.applications
      ADD COLUMN resume_id UUID NULL REFERENCES public.resumes(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_user_created ON public.applications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_applications_resume_id ON public.applications(resume_id);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can view own applications'
  ) THEN
    CREATE POLICY "Users can view own applications"
      ON public.applications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can insert own applications'
  ) THEN
    CREATE POLICY "Users can insert own applications"
      ON public.applications FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND (
          resume_id IS NULL OR EXISTS (
            SELECT 1 FROM public.resumes r
            WHERE r.id = resume_id AND r.user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can update own applications'
  ) THEN
    CREATE POLICY "Users can update own applications"
      ON public.applications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND (
          resume_id IS NULL OR EXISTS (
            SELECT 1 FROM public.resumes r
            WHERE r.id = resume_id AND r.user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can delete own applications'
  ) THEN
    CREATE POLICY "Users can delete own applications"
      ON public.applications FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_applications_updated_at ON public.applications;
CREATE TRIGGER tr_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Follow-ups Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  note TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON public.follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_app_id ON public.follow_ups(application_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_scheduled ON public.follow_ups(user_id, scheduled_for, status);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'follow_ups' AND policyname = 'Users can view own follow ups'
  ) THEN
    CREATE POLICY "Users can view own follow ups"
      ON public.follow_ups FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'follow_ups' AND policyname = 'Users can insert own follow ups'
  ) THEN
    CREATE POLICY "Users can insert own follow ups"
      ON public.follow_ups FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.id = application_id AND a.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'follow_ups' AND policyname = 'Users can update own follow ups'
  ) THEN
    CREATE POLICY "Users can update own follow ups"
      ON public.follow_ups FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.id = application_id AND a.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'follow_ups' AND policyname = 'Users can delete own follow ups'
  ) THEN
    CREATE POLICY "Users can delete own follow ups"
      ON public.follow_ups FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER tr_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Saved Jobs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT NULL,
  location TEXT NOT NULL DEFAULT '',
  workplace_type TEXT NOT NULL DEFAULT 'Remote',
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  category TEXT NULL,
  salary TEXT NULL,
  apply_url TEXT NOT NULL DEFAULT '',
  posted_date TEXT NULL,
  source TEXT NOT NULL DEFAULT 'External',
  skills TEXT[] DEFAULT '{}'::text[],
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_saved_jobs_user_job UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_saved ON public.saved_jobs(user_id, saved_at DESC);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can view own saved jobs'
  ) THEN
    CREATE POLICY "Users can view own saved jobs"
      ON public.saved_jobs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can insert own saved jobs'
  ) THEN
    CREATE POLICY "Users can insert own saved jobs"
      ON public.saved_jobs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can update own saved jobs'
  ) THEN
    CREATE POLICY "Users can update own saved jobs"
      ON public.saved_jobs FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can delete own saved jobs'
  ) THEN
    CREATE POLICY "Users can delete own saved jobs"
      ON public.saved_jobs FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_saved_jobs_updated_at ON public.saved_jobs;
CREATE TRIGGER tr_saved_jobs_updated_at
  BEFORE UPDATE ON public.saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Cover Letters Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  job_id TEXT NULL,
  application_id UUID NULL REFERENCES public.applications(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user ON public.cover_letters(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letters_app ON public.cover_letters(application_id);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cover_letters' AND policyname = 'Users can view own cover letters'
  ) THEN
    CREATE POLICY "Users can view own cover letters"
      ON public.cover_letters FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cover_letters' AND policyname = 'Users can insert own cover letters'
  ) THEN
    CREATE POLICY "Users can insert own cover letters"
      ON public.cover_letters FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND (
          application_id IS NULL OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cover_letters' AND policyname = 'Users can update own cover letters'
  ) THEN
    CREATE POLICY "Users can update own cover letters"
      ON public.cover_letters FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND (
          application_id IS NULL OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cover_letters' AND policyname = 'Users can delete own cover letters'
  ) THEN
    CREATE POLICY "Users can delete own cover letters"
      ON public.cover_letters FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_cover_letters_updated_at ON public.cover_letters;
CREATE TRIGGER tr_cover_letters_updated_at
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Job Alerts Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'daily',
  status TEXT NOT NULL CHECK (status IN ('active', 'paused')) DEFAULT 'active',
  last_checked_at TIMESTAMPTZ NULL,
  last_notified_at TIMESTAMPTZ NULL,
  notified_job_ids TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_alerts_user_status ON public.job_alerts(user_id, status);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_alerts' AND policyname = 'Users can view own job alerts'
  ) THEN
    CREATE POLICY "Users can view own job alerts"
      ON public.job_alerts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_alerts' AND policyname = 'Users can insert own job alerts'
  ) THEN
    CREATE POLICY "Users can insert own job alerts"
      ON public.job_alerts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_alerts' AND policyname = 'Users can update own job alerts'
  ) THEN
    CREATE POLICY "Users can update own job alerts"
      ON public.job_alerts FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_alerts' AND policyname = 'Users can delete own job alerts'
  ) THEN
    CREATE POLICY "Users can delete own job alerts"
      ON public.job_alerts FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_job_alerts_updated_at ON public.job_alerts;
CREATE TRIGGER tr_job_alerts_updated_at
  BEFORE UPDATE ON public.job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 8. Interview Prep Checklists Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_prep_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  key_id TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_prep_user_key UNIQUE (user_id, key_id)
);

CREATE INDEX IF NOT EXISTS idx_prep_user_key ON public.interview_prep_checklists(user_id, key_id);

ALTER TABLE public.interview_prep_checklists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep_checklists' AND policyname = 'Users can view own prep checklists'
  ) THEN
    CREATE POLICY "Users can view own prep checklists"
      ON public.interview_prep_checklists FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep_checklists' AND policyname = 'Users can insert own prep checklists'
  ) THEN
    CREATE POLICY "Users can insert own prep checklists"
      ON public.interview_prep_checklists FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep_checklists' AND policyname = 'Users can update own prep checklists'
  ) THEN
    CREATE POLICY "Users can update own prep checklists"
      ON public.interview_prep_checklists FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep_checklists' AND policyname = 'Users can delete own prep checklists'
  ) THEN
    CREATE POLICY "Users can delete own prep checklists"
      ON public.interview_prep_checklists FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_prep_updated_at ON public.interview_prep_checklists;
CREATE TRIGGER tr_prep_updated_at
  BEFORE UPDATE ON public.interview_prep_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
