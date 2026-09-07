ALTER TABLE public.resume_analyses
  ADD COLUMN IF NOT EXISTS overall_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skills_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS projects_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS experience_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS education_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completeness_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detected_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS programming_languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_ml_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS web_development_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS projects text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internships text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS placement_readiness integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS readiness_level text NOT NULL DEFAULT 'Beginner';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_analyses TO authenticated;
GRANT ALL ON public.resume_analyses TO service_role;