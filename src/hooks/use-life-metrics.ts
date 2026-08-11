import {
  achievements,
  careerReadiness,
  isRole,
  lifeScore,
  normaliseSkills,
  placementReadiness,
  skillGaps,
  streakFromDates,
  type Role,
  type SkillMap,
} from "@/lib/career";
import {
  useCareerProfile,
  useGoals,
  useInterviewSessions,
  usePlacements,
  useResumeAnalyses,
  useRoadmap,
  useSubjects,
  useTasks,
} from "@/lib/queries";

export function useLifeMetrics() {
  const { data: career } = useCareerProfile();
  const { data: subjects } = useSubjects();
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const { data: placements } = usePlacements();
  const { data: resumes } = useResumeAnalyses();
  const { data: interviews } = useInterviewSessions();
  const { data: roadmap } = useRoadmap();

  const role: Role = isRole(career?.target_role) ? career.target_role : "Software Engineer";
  const skills: SkillMap = normaliseSkills(career?.skills);
  const weeklyHours = Number(career?.weekly_hours) || 10;

  const career_ = careerReadiness(role, skills);
  const gaps = skillGaps(role, skills);

  const target = (subjects ?? []).reduce((sum, item) => sum + Number(item.target_hours), 0);
  const done = (subjects ?? []).reduce((sum, item) => sum + Number(item.completed_hours), 0);
  const roadmapDone = (roadmap ?? []).filter((item) => item.completed).length;
  const roadmapProgress = (roadmap ?? []).length ? (roadmapDone / (roadmap ?? []).length) * 100 : 0;
  const study = Math.round(
    target ? Math.min(100, (done / target) * 100) * 0.7 + roadmapProgress * 0.3 : roadmapProgress,
  );

  const activeGoals = (goals ?? []).filter((goal) => goal.status !== "done");
  const goalScore = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length)
    : (goals ?? []).length
      ? 100
      : 0;

  const recentTasks = (tasks ?? []).filter((task) => {
    const due = new Date(`${task.due_date}T00:00:00`).getTime();
    return Date.now() - due < 7 * 86_400_000;
  });
  const productivity = recentTasks.length
    ? Math.round((recentTasks.filter((task) => task.completed).length / recentTasks.length) * 100)
    : 0;

  const atsScore = (resumes ?? [])[0]?.ats_score ?? 0;
  const bestInterviewScore = (interviews ?? []).reduce(
    (best, session) => Math.max(best, session.overall_score ?? 0),
    0,
  );
  const placement = placementReadiness({
    atsScore,
    applications: (placements ?? []).length,
    interviews: (interviews ?? []).length,
    bestInterviewScore,
    careerReadiness: career_,
  });

  const breakdown = {
    careerReadiness: career_,
    studyProgress: study,
    placementReadiness: placement,
    goals: goalScore,
    productivity,
  };

  const studyStreak = streakFromDates(
    (tasks ?? []).filter((task) => task.completed).map((task) => task.due_date),
  );

  const badges = achievements({
    atsScore,
    studyStreak,
    roadmapDone,
    dsaStarted: (skills["DSA"] ?? "missing") !== "missing",
    bestInterviewScore,
    completedGoals: (goals ?? []).filter((goal) => goal.progress >= 100).length,
  });

  const aiContext = [
    `Target role: ${role}`,
    `Weekly study hours available: ${weeklyHours}`,
    `Skill levels: ${Object.entries(skills)
      .map(([name, level]) => `${name}=${level}`)
      .join(", ") || "not set"}`,
    `Skill gaps: ${gaps.join(", ") || "none"}`,
    `Subjects: ${(subjects ?? [])
      .map((s) => `${s.name} ${s.completed_hours}/${s.target_hours}h`)
      .join(", ") || "none"}`,
    `Active goals: ${activeGoals.map((g) => `${g.title} ${g.progress}%`).join(", ") || "none"}`,
    `Open tasks today: ${(tasks ?? [])
      .filter((t) => !t.completed)
      .slice(0, 6)
      .map((t) => t.title)
      .join(", ") || "none"}`,
    `Placement pipeline: ${(placements ?? [])
      .map((p) => `${p.company} (${p.status})`)
      .join(", ") || "no applications yet"}`,
    `Latest resume ATS score: ${atsScore || "no resume analysed"}`,
    `Best mock interview score: ${bestInterviewScore || "no interviews yet"}`,
    `Roadmap progress: ${roadmapDone}/${(roadmap ?? []).length} days done`,
    `Scores — career ${career_}%, study ${study}%, placement ${placement}%, goals ${goalScore}%, productivity ${productivity}%`,
  ].join("\n");

  return {
    role,
    skills,
    weeklyHours,
    gaps,
    breakdown,
    total: lifeScore(breakdown),
    badges,
    studyStreak,
    atsScore,
    bestInterviewScore,
    roadmapDone,
    aiContext,
    hasData: Boolean((tasks ?? []).length || (subjects ?? []).length || (placements ?? []).length),
  };
}
