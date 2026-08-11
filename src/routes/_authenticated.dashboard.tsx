import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { LifeScoreCard } from "@/components/app/LifeScoreCard";
import { DailyInsightCard } from "@/components/app/DailyInsightCard";
import { AchievementBadges } from "@/components/app/AchievementBadges";
import { useLifeMetrics } from "@/hooks/use-life-metrics";
import { useSeedDemoData } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useExpenses, useGoals, useHealthLogs, useSubjects, useTaskMutations, useTasks } from "@/lib/queries";
import { clampPercent, currency, greeting, today } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LifeOS AI" },
      {
        name: "description",
        content: "Your daily overview: tasks, study progress, goals, spending and health at a glance.",
      },
      { property: "og:title", content: "Dashboard — LifeOS AI" },
      { property: "og:description", content: "Your daily life overview, powered by AI." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile } = useProfile();
  const metrics = useLifeMetrics();
  const seed = useSeedDemoData();
  const { data: tasks, isPending } = useTasks();
  const { data: subjects } = useSubjects();
  const { data: goals } = useGoals();
  const { data: expenses } = useExpenses();
  const { data: health } = useHealthLogs();
  const { add, toggle, remove } = useTaskMutations();
  const [title, setTitle] = useState("");

  const todaysTasks = (tasks ?? []).filter((task) => task.due_date === today());
  const doneToday = todaysTasks.filter((task) => task.completed).length;
  const taskPercent = todaysTasks.length ? (doneToday / todaysTasks.length) * 100 : 0;

  const studyTarget = (subjects ?? []).reduce((sum, subject) => sum + Number(subject.target_hours), 0);
  const studyDone = (subjects ?? []).reduce((sum, subject) => sum + Number(subject.completed_hours), 0);

  const activeGoals = (goals ?? []).filter((goal) => goal.status !== "done");
  const goalAverage = activeGoals.length
    ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length
    : 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthSpend = (expenses ?? [])
    .filter((expense) => new Date(expense.spent_on) >= monthStart)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const todaysHealth = (health ?? []).find((log) => log.log_date === today());

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await add.mutateAsync({ title: title.trim() });
      setTitle("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the task.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={profile?.full_name ? profile.full_name.split(" ")[0]! : "Welcome"}
        description="Here's where your day stands. Small wins compound."
        action={
          <Button variant="hero" size="lg" asChild>
            <Link to="/assistant">
              <Sparkles className="size-4" />
              Ask LifeOS AI
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <LifeScoreCard total={metrics.total} breakdown={metrics.breakdown} />
        <DailyInsightCard context={metrics.aiContext} disabled={!metrics.hasData} />
      </div>

      {!metrics.hasData ? (
        <GlassCard className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Nothing here yet — load a realistic sample student profile to explore every feature.
          </p>
          <Button
            variant="hero"
            size="sm"
            className="rounded-full"
            disabled={seed.isPending}
            onClick={() =>
              seed.mutate(undefined, {
                onSuccess: () => toast.success("Demo data loaded."),
                onError: (error) =>
                  toast.error(error instanceof Error ? error.message : "Could not load demo data."),
              })
            }
          >
            <Sparkles className="size-4" />
            Load demo data
          </Button>
        </GlassCard>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={Target}
          label="Career readiness"
          value={`${metrics.breakdown.careerReadiness}%`}
          percent={metrics.breakdown.careerReadiness}
          to="/career"
        />
        <MetricCard
          icon={Sparkles}
          label="Placement readiness"
          value={`${metrics.breakdown.placementReadiness}%`}
          percent={metrics.breakdown.placementReadiness}
          to="/placements"
        />
      </div>

      <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          label="Today's tasks"
          value={`${doneToday}/${todaysTasks.length}`}
          percent={taskPercent}
          to="/dashboard"
        />
        <MetricCard
          icon={BookOpen}
          label="Study hours"
          value={`${studyDone}/${studyTarget || 0}h`}
          percent={studyTarget ? (studyDone / studyTarget) * 100 : 0}
          to="/study"
        />
        <MetricCard
          icon={Target}
          label="Goal momentum"
          value={`${clampPercent(goalAverage)}%`}
          percent={goalAverage}
          to="/goals"
        />
        <MetricCard
          icon={Wallet}
          label="Spent this month"
          value={currency(monthSpend)}
          to="/expenses"
        />
      </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard>
          <SectionTitle title="Today's plan" subtitle="Quick capture, quick wins." />
          <form className="flex gap-2" onSubmit={handleAdd}>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a task for today…"
              aria-label="Task title"
            />
            <Button type="submit" variant="hero" size="icon" disabled={add.isPending} aria-label="Add task">
              <Plus className="size-4" />
            </Button>
          </form>

          <ul className="mt-4 space-y-2">
            {isPending
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 rounded-2xl" />
                ))
              : null}
            {!isPending && todaysTasks.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing scheduled. Add your first task above.
              </li>
            ) : null}
            {todaysTasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5 transition-colors hover:bg-secondary/70"
              >
                <button
                  type="button"
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  onClick={() => toggle.mutate({ id: task.id, completed: !task.completed })}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {task.completed ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    task.completed && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {task.priority}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete task"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => remove.mutate(task.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Health today" subtitle="Hydrate, sleep, move." />
            <div className="space-y-3 text-sm">
              <HealthRow label="Water" value={`${todaysHealth?.water_glasses ?? 0} / 8 glasses`} percent={((todaysHealth?.water_glasses ?? 0) / 8) * 100} />
              <HealthRow label="Sleep" value={`${todaysHealth?.sleep_hours ?? 0} / 8 h`} percent={((Number(todaysHealth?.sleep_hours) || 0) / 8) * 100} />
              <HealthRow label="Steps" value={`${(todaysHealth?.steps ?? 0).toLocaleString()} / 8,000`} percent={((todaysHealth?.steps ?? 0) / 8000) * 100} />
            </div>
            <Button variant="glass" className="mt-4 w-full rounded-2xl" asChild>
              <Link to="/health">
                <Activity className="size-4" />
                Log today
              </Link>
            </Button>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Goals in flight" />
            <ul className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => (
                <li key={goal.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-3">{goal.title}</span>
                    <span className="text-muted-foreground">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="mt-2 h-1.5" />
                </li>
              ))}
              {activeGoals.length === 0 ? (
                <li className="text-sm text-muted-foreground">No active goals yet.</li>
              ) : null}
            </ul>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6">
        <AchievementBadges badges={metrics.badges} />
      </div>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  percent,
  to,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  percent?: number;
  to: string;
}) {
  return (
    <Link to={to} className="block">
      <GlassCard interactive className="h-full">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="size-4 text-primary" />
        </div>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
        {percent === undefined ? null : (
          <Progress value={clampPercent(percent)} className="mt-3 h-1.5" />
        )}
      </GlassCard>
    </Link>
  );
}

function HealthRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}</span>
      </div>
      <Progress value={clampPercent(percent)} className="mt-1.5 h-1.5" />
    </div>
  );
}
