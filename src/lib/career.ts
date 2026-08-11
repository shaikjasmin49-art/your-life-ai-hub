export const ROLES = [
  "Software Engineer",
  "AI/ML Engineer",
  "Full Stack Developer",
  "Data Analyst",
] as const;

export type Role = (typeof ROLES)[number];

export type SkillLevel = "strong" | "learning" | "missing";
export type SkillMap = Record<string, SkillLevel>;

export const ROLE_SKILLS: Record<Role, string[]> = {
  "Software Engineer": ["DSA", "C++/Java", "OOP", "DBMS", "SQL", "Operating Systems", "Git", "System Design"],
  "AI/ML Engineer": ["Python", "Math & Statistics", "Machine Learning", "Deep Learning", "Pandas/NumPy", "SQL", "Git", "MLOps"],
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "REST APIs", "SQL", "Git", "Testing", "Cloud Deploy"],
  "Data Analyst": ["SQL", "Excel", "Python", "Statistics", "Data Visualisation", "Power BI/Tableau", "Storytelling", "Git"],
};

export const LEVEL_LABEL: Record<SkillLevel, string> = {
  strong: "Confident",
  learning: "Learning",
  missing: "Not started",
};

export function levelWeight(level: SkillLevel | undefined) {
  if (level === "strong") return 1;
  if (level === "learning") return 0.5;
  return 0;
}

export function isRole(value: string | null | undefined): value is Role {
  return ROLES.includes((value ?? "") as Role);
}

export function normaliseSkills(value: unknown): SkillMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: SkillMap = {};
  for (const [key, level] of Object.entries(value as Record<string, unknown>)) {
    if (level === "strong" || level === "learning" || level === "missing") out[key] = level;
  }
  return out;
}

export function careerReadiness(role: Role, skills: SkillMap) {
  const required = ROLE_SKILLS[role];
  if (!required.length) return 0;
  const score = required.reduce((sum, skill) => sum + levelWeight(skills[skill]), 0);
  return Math.round((score / required.length) * 100);
}

export function skillGaps(role: Role, skills: SkillMap) {
  return ROLE_SKILLS[role].filter((skill) => (skills[skill] ?? "missing") !== "strong");
}

export type LifeScoreInput = {
  careerReadiness: number;
  studyProgress: number;
  placementReadiness: number;
  goals: number;
  productivity: number;
};

export const SCORE_WEIGHTS: Record<keyof LifeScoreInput, number> = {
  careerReadiness: 0.25,
  studyProgress: 0.2,
  placementReadiness: 0.25,
  goals: 0.15,
  productivity: 0.15,
};

export function lifeScore(input: LifeScoreInput) {
  const total = (Object.keys(SCORE_WEIGHTS) as (keyof LifeScoreInput)[]).reduce(
    (sum, key) => sum + Math.max(0, Math.min(100, input[key])) * SCORE_WEIGHTS[key],
    0,
  );
  return Math.round(total);
}

export function placementReadiness(input: {
  atsScore: number;
  applications: number;
  interviews: number;
  bestInterviewScore: number;
  careerReadiness: number;
}) {
  const resume = Math.min(100, input.atsScore);
  const pipeline = Math.min(100, input.applications * 20);
  const interview = input.interviews ? Math.min(100, input.bestInterviewScore) : 0;
  return Math.round(resume * 0.3 + pipeline * 0.2 + interview * 0.25 + input.careerReadiness * 0.25);
}

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export function achievements(input: {
  atsScore: number;
  studyStreak: number;
  roadmapDone: number;
  dsaStarted: boolean;
  bestInterviewScore: number;
  completedGoals: number;
}): Badge[] {
  return [
    {
      id: "resume-ready",
      emoji: "🏆",
      title: "Resume Ready",
      description: "Score 75+ on the ATS analyzer",
      unlocked: input.atsScore >= 75,
    },
    {
      id: "streak",
      emoji: "🔥",
      title: "7 Day Study Streak",
      description: "Finish a task 7 days in a row",
      unlocked: input.studyStreak >= 7,
    },
    {
      id: "dsa",
      emoji: "💻",
      title: "DSA Starter",
      description: "Start DSA and clear 3 roadmap days",
      unlocked: input.dsaStarted && input.roadmapDone >= 3,
    },
    {
      id: "interview",
      emoji: "🎤",
      title: "Interview Ready",
      description: "Score 70+ in a mock interview",
      unlocked: input.bestInterviewScore >= 70,
    },
    {
      id: "goal",
      emoji: "🎯",
      title: "Goal Achiever",
      description: "Take a goal all the way to 100%",
      unlocked: input.completedGoals >= 1,
    },
  ];
}

export function streakFromDates(dates: string[]) {
  const unique = Array.from(new Set(dates)).sort().reverse();
  if (!unique.length) return 0;
  const dayMs = 86_400_000;
  const startOf = (value: string) => new Date(`${value}T00:00:00`).getTime();
  const todayMs = startOf(new Date().toISOString().slice(0, 10));
  if (todayMs - startOf(unique[0]!) > dayMs) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i += 1) {
    if (startOf(unique[i - 1]!) - startOf(unique[i]!) === dayMs) streak += 1;
    else break;
  }
  return streak;
}
