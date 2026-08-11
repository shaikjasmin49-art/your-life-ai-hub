import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

function dayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const ROADMAP_TOPICS = [
  ["Arrays & Two Pointers", "Solve 6 easy array problems, revise sliding window"],
  ["Strings", "Pattern matching, palindromes, 5 problems"],
  ["SQL Joins", "Inner/outer joins, 10 queries on a sample schema"],
  ["DBMS Normalisation", "1NF to 3NF with examples, ER diagrams"],
  ["Linked Lists", "Reversal, cycle detection, merge two lists"],
  ["Stacks & Queues", "Monotonic stack, next greater element"],
  ["Recursion", "Subsets, permutations, backtracking basics"],
  ["Hashing", "Frequency maps, anagram and subarray problems"],
  ["OOP Concepts", "Abstraction, polymorphism, real code examples"],
  ["Mock Test 1", "60 minute timed test on weeks 1-2 topics"],
  ["Trees", "Traversals, height, diameter"],
  ["Binary Search", "On answers, rotated arrays"],
  ["SQL Aggregations", "Group by, having, window functions"],
  ["Operating Systems", "Processes, threads, scheduling"],
  ["Git Workflow", "Branching, rebase, pull request hygiene"],
  ["Greedy", "Interval scheduling, activity selection"],
  ["Sorting", "Merge, quick, counting sort trade-offs"],
  ["Graphs Intro", "BFS, DFS, connected components"],
  ["Resume Polish", "Quantify two project bullets, add keywords"],
  ["Mock Test 2", "Timed test plus review of every mistake"],
  ["Dynamic Programming", "Knapsack, LIS, memo to tabulation"],
  ["DP Practice", "5 medium DP problems"],
  ["System Design Basics", "Load balancing, caching, DB choice"],
  ["Indexing & Transactions", "B-trees, ACID, isolation levels"],
  ["Project Deep Dive", "Prepare a 3 minute walkthrough of your best project"],
  ["Behavioural Prep", "STAR answers for 6 common questions"],
  ["Graphs Advanced", "Dijkstra, topological sort"],
  ["Weak Area Revision", "Redo the problems you failed this month"],
  ["Company Prep", "Solve past questions for your target company"],
  ["Mock Interview Day", "Full mock interview, then log the feedback"],
] as const;

export function useSeedDemoData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You need to be signed in.");

      await supabase.from("career_profiles").upsert(
        {
          user_id: userId,
          target_role: "Software Engineer",
          weekly_hours: 14,
          skills: {
            "DSA": "learning",
            "C++/Java": "strong",
            OOP: "strong",
            DBMS: "learning",
            SQL: "learning",
            "Operating Systems": "learning",
            Git: "missing",
            "System Design": "missing",
          },
        },
        { onConflict: "user_id" },
      );

      await supabase.from("profiles").update({
        bio: "Final year CSE student preparing for campus placements.",
        skills: ["Python", "C++", "React", "SQL", "Git basics"],
        achievements: ["Smart India Hackathon finalist", "300+ DSA problems solved"],
      }).eq("id", userId);

      await supabase.from("tasks").insert([
        { user_id: userId, title: "Practise 5 SQL join queries", priority: "high", due_date: dayOffset(0) },
        { user_id: userId, title: "Revise DBMS normalisation", priority: "high", due_date: dayOffset(0) },
        { user_id: userId, title: "Solve 3 array problems", priority: "medium", due_date: dayOffset(0), completed: true },
        { user_id: userId, title: "Update resume projects section", priority: "medium", due_date: dayOffset(1) },
        { user_id: userId, title: "Mock interview with a friend", priority: "low", due_date: dayOffset(2) },
        ...Array.from({ length: 6 }).map((_, index) => ({
          user_id: userId,
          title: `Daily DSA set ${index + 1}`,
          priority: "medium",
          due_date: dayOffset(-(index + 1)),
          completed: true,
        })),
      ]);

      await supabase.from("subjects").insert([
        { user_id: userId, name: "DSA", target_hours: 60, completed_hours: 38, color: "violet" },
        { user_id: userId, name: "DBMS", target_hours: 25, completed_hours: 9, color: "blue" },
        { user_id: userId, name: "Operating Systems", target_hours: 20, completed_hours: 12, color: "violet" },
        { user_id: userId, name: "Aptitude", target_hours: 15, completed_hours: 13, color: "blue" },
      ]);

      await supabase.from("goals").insert([
        { user_id: userId, title: "Crack a product company placement", category: "career", progress: 62, target_date: dayOffset(120) },
        { user_id: userId, title: "Solve 500 DSA problems", category: "study", progress: 74, target_date: dayOffset(90) },
        { user_id: userId, title: "Ship a full stack portfolio project", category: "career", progress: 45, target_date: dayOffset(45) },
        { user_id: userId, title: "Finish DBMS revision", category: "study", progress: 100, status: "done" },
      ]);

      await supabase.from("placement_applications").insert([
        { user_id: userId, company: "Infosys", role: "Systems Engineer", applied_on: dayOffset(-24), status: "interview", assessment_on: dayOffset(-14), interview_on: dayOffset(3) },
        { user_id: userId, company: "TCS Digital", role: "Software Developer", applied_on: dayOffset(-30), status: "selected", assessment_on: dayOffset(-20), interview_on: dayOffset(-10) },
        { user_id: userId, company: "Zoho", role: "Software Engineer", applied_on: dayOffset(-12), status: "assessment", assessment_on: dayOffset(4) },
        { user_id: userId, company: "Amazon", role: "SDE Intern", applied_on: dayOffset(-6), status: "applied" },
        { user_id: userId, company: "Freshworks", role: "Associate Engineer", applied_on: dayOffset(-40), status: "rejected" },
      ]);

      await supabase.from("expenses").insert([
        { user_id: userId, amount: 240, category: "food", note: "Mess fees", spent_on: dayOffset(-2) },
        { user_id: userId, amount: 55, category: "transport", note: "Bus pass", spent_on: dayOffset(-4) },
        { user_id: userId, amount: 120, category: "education", note: "DSA course", spent_on: dayOffset(-8) },
        { user_id: userId, amount: 30, category: "other", note: "Stationery", spent_on: dayOffset(-1) },
      ]);

      await supabase.from("health_logs").upsert(
        Array.from({ length: 7 }).map((_, index) => ({
          user_id: userId,
          log_date: dayOffset(-index),
          water_glasses: 5 + ((index * 2) % 4),
          sleep_hours: 6 + ((index % 3) * 0.5),
          steps: 4200 + index * 600,
        })),
        { onConflict: "user_id,log_date" },
      );

      await supabase.from("resume_analyses").insert({
        user_id: userId,
        file_name: "sample-student-resume.pdf",
        target_role: "Software Engineer",
        ats_score: 68,
        summary: "Solid academics and projects, but weak on quantified impact and missing core placement keywords.",
        strengths: ["Clean single-column layout", "Two relevant projects", "Clear education section"],
        missing_skills: ["System design", "Git workflow", "Unit testing"],
        missing_keywords: ["REST API", "SQL", "Data structures", "Agile"],
        project_ideas: ["A REST API with auth and Postgres", "A DSA visualiser web app"],
        suggestions: [
          "Add numbers to every project bullet (users, latency, accuracy).",
          "Move skills above projects so ATS parses them first.",
          "Name the exact tech stack per project.",
          "Add a one-line summary tuned to the target role.",
        ],
      });

      await supabase.from("interview_sessions").insert({
        user_id: userId,
        target_role: "Software Engineer",
        status: "done",
        overall_score: 64,
        strengths: ["Clear project explanations", "Good communication pace"],
        weaknesses: ["Shallow DBMS answers", "Missed edge cases in coding round"],
        recommended_topics: ["SQL joins", "Normalisation", "Time complexity analysis"],
        turns: [
          {
            question: "Explain the difference between an inner join and a left join.",
            answer: "Inner join returns matching rows, left join keeps all left rows.",
            technical: 62,
            communication: 70,
            confidence: 66,
            completeness: 55,
            feedback: "Correct at a high level — add an example and mention NULL handling.",
          },
        ],
      });

      await supabase.from("roadmap_tasks").delete().eq("user_id", userId);
      await supabase.from("roadmap_tasks").insert(
        ROADMAP_TOPICS.map(([topic, focus], index) => ({
          user_id: userId,
          target_role: "Software Engineer",
          day: index + 1,
          topic,
          focus,
          hours: 2,
          completed: index < 4,
        })),
      );

      return true;
    },
    onSuccess: () => void queryClient.invalidateQueries(),
  });
}
