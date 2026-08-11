import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { today } from "@/lib/format";

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("You need to be signed in.");
  return id;
}

function useInvalidate(keys: string[][]) {
  const queryClient = useQueryClient();
  return () => keys.forEach((key) => void queryClient.invalidateQueries({ queryKey: key }));
}

/* ---------------- profile ---------------- */

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const invalidate = useInvalidate([["profile"]]);
  return useMutation({
    mutationFn: async (values: {
      full_name?: string | null;
      bio?: string | null;
      skills?: string[];
      achievements?: string[];
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("profiles").update(values).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ---------------- tasks ---------------- */

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskMutations() {
  const invalidate = useInvalidate([["tasks"]]);

  const add = useMutation({
    mutationFn: async (values: { title: string; priority?: string; due_date?: string | null }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("tasks").insert({
        user_id: userId,
        title: values.title,
        priority: values.priority ?? "medium",
        due_date: values.due_date ?? today(),
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: async (values: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: values.completed })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, toggle, remove };
}

/* ---------------- subjects ---------------- */

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSubjectMutations() {
  const invalidate = useInvalidate([["subjects"]]);

  const add = useMutation({
    mutationFn: async (values: { name: string; target_hours: number }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("subjects").insert({
        user_id: userId,
        name: values.name,
        target_hours: values.target_hours,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const logHours = useMutation({
    mutationFn: async (values: { id: string; completed_hours: number }) => {
      const { error } = await supabase
        .from("subjects")
        .update({ completed_hours: values.completed_hours })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, logHours, remove };
}

/* ---------------- goals ---------------- */

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useGoalMutations() {
  const invalidate = useInvalidate([["goals"]]);

  const add = useMutation({
    mutationFn: async (values: {
      title: string;
      category: string;
      target_date?: string | null;
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        title: values.title,
        category: values.category,
        target_date: values.target_date ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setProgress = useMutation({
    mutationFn: async (values: { id: string; progress: number }) => {
      const { error } = await supabase
        .from("goals")
        .update({ progress: values.progress })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, setProgress, remove };
}

/* ---------------- expenses ---------------- */

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("spent_on", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function useExpenseMutations() {
  const invalidate = useInvalidate([["expenses"]]);

  const add = useMutation({
    mutationFn: async (values: {
      note: string;
      amount: number;
      category: string;
      spent_on: string;
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("expenses").insert({ user_id: userId, ...values });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

/* ---------------- health ---------------- */

export function useHealthLogs() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertHealthLog() {
  const invalidate = useInvalidate([["health"]]);
  return useMutation({
    mutationFn: async (values: {
      log_date: string;
      water_glasses: number;
      sleep_hours: number;
      steps: number;
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase
        .from("health_logs")
        .upsert({ user_id: userId, ...values }, { onConflict: "user_id,log_date" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ---------------- resume ---------------- */

export function useResumeAnalyses() {
  return useQuery({
    queryKey: ["resume-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveResumeAnalysis() {
  const invalidate = useInvalidate([["resume-analyses"]]);
  return useMutation({
    mutationFn: async (values: {
      file_name: string;
      ats_score: number;
      summary: string;
      missing_skills: string[];
      suggestions: string[];
      strengths?: string[];
      missing_keywords?: string[];
      project_ideas?: string[];
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("resume_analyses").insert({ user_id: userId, ...values });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ---------------- chat threads ---------------- */

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useThreadMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: ["thread-messages", threadId],
    enabled: Boolean(threadId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useThreadMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (title?: string) => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userId, title: title ?? "New conversation" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["threads"] }),
  });

  const rename = useMutation({
    mutationFn: async (values: { id: string; title: string }) => {
      const { error } = await supabase
        .from("chat_threads")
        .update({ title: values.title })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["threads"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_threads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["threads"] }),
  });

  return { create, rename, remove };
}

/* ---------------- career profile ---------------- */

export function useCareerProfile() {
  return useQuery({
    queryKey: ["career-profile"],
    queryFn: async () => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("career_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveCareerProfile() {
  const invalidate = useInvalidate([["career-profile"]]);
  return useMutation({
    mutationFn: async (values: {
      target_role?: string;
      weekly_hours?: number;
      skills?: Record<string, string>;
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase
        .from("career_profiles")
        .upsert({ user_id: userId, ...values }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ---------------- placement applications ---------------- */

export function usePlacements() {
  return useQuery({
    queryKey: ["placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placement_applications")
        .select("*")
        .order("applied_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePlacementMutations() {
  const invalidate = useInvalidate([["placements"]]);

  const add = useMutation({
    mutationFn: async (values: {
      company: string;
      role: string;
      applied_on: string;
      status: string;
      assessment_on?: string | null;
      interview_on?: string | null;
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("placement_applications").insert({
        user_id: userId,
        ...values,
        assessment_on: values.assessment_on || null,
        interview_on: values.interview_on || null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: async (values: { id: string; status: string }) => {
      const { error } = await supabase
        .from("placement_applications")
        .update({ status: values.status })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("placement_applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, setStatus, remove };
}

/* ---------------- roadmap ---------------- */

export function useRoadmap() {
  return useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_tasks")
        .select("*")
        .order("day", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useRoadmapMutations() {
  const invalidate = useInvalidate([["roadmap"]]);

  const replace = useMutation({
    mutationFn: async (values: {
      targetRole: string;
      days: { day: number; topic: string; focus: string; hours: number }[];
    }) => {
      const userId = await requireUserId();
      const { error: clearError } = await supabase
        .from("roadmap_tasks")
        .delete()
        .eq("user_id", userId);
      if (clearError) throw clearError;
      const { error } = await supabase.from("roadmap_tasks").insert(
        values.days.map((day) => ({
          user_id: userId,
          target_role: values.targetRole,
          day: day.day,
          topic: day.topic,
          focus: day.focus,
          hours: day.hours,
        })),
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: async (values: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("roadmap_tasks")
        .update({ completed: values.completed })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { replace, toggle };
}

/* ---------------- mock interviews ---------------- */

export function useInterviewSessions() {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useInterviewMutations() {
  const invalidate = useInvalidate([["interviews"]]);

  const save = useMutation({
    mutationFn: async (values: {
      target_role: string;
      turns: unknown;
      overall_score: number;
      strengths: string[];
      weaknesses: string[];
      recommended_topics: string[];
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("interview_sessions").insert({
        user_id: userId,
        status: "done",
        ...values,
        turns: values.turns as never,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { save };
}
