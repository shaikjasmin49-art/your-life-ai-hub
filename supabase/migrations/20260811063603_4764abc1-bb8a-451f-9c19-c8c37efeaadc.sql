-- career profile
CREATE TABLE public.career_profiles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role text NOT NULL DEFAULT 'Software Engineer',
  weekly_hours numeric NOT NULL DEFAULT 10,
  skills jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_profiles TO authenticated;
GRANT ALL ON public.career_profiles TO service_role;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own career profile" ON public.career_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER career_profiles_updated BEFORE UPDATE ON public.career_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- placement applications
CREATE TABLE public.placement_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  applied_on date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'applied',
  assessment_on date,
  interview_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_applications TO authenticated;
GRANT ALL ON public.placement_applications TO service_role;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications" ON public.placement_applications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER placement_applications_updated BEFORE UPDATE ON public.placement_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 30 day roadmap
CREATE TABLE public.roadmap_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day integer NOT NULL,
  topic text NOT NULL,
  focus text,
  hours numeric NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  target_role text NOT NULL DEFAULT 'Software Engineer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_tasks TO authenticated;
GRANT ALL ON public.roadmap_tasks TO service_role;
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roadmap" ON public.roadmap_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER roadmap_tasks_updated BEFORE UPDATE ON public.roadmap_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- mock interviews
CREATE TABLE public.interview_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  turns jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_score integer,
  strengths text[] NOT NULL DEFAULT '{}'::text[],
  weaknesses text[] NOT NULL DEFAULT '{}'::text[],
  recommended_topics text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interviews" ON public.interview_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER interview_sessions_updated BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- richer resume analyses
ALTER TABLE public.resume_analyses
  ADD COLUMN IF NOT EXISTS strengths text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS missing_keywords text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS project_ideas text[] NOT NULL DEFAULT '{}'::text[];