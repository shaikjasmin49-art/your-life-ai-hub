import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { GlassCard, SectionTitle, StatPill } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { clampPercent, currency, shortDate } from "@/lib/format";
import { useExpenses, useGoals, useHealthLogs, useSubjects, useTasks } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — LifeOS AI" },
      { name: "description", content: "Combined analytics across your tasks, study, spending, goals and health." },
      { property: "og:title", content: "Analytics — LifeOS AI" },
      { property: "og:description", content: "Every area of your life, side by side." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: tasks } = useTasks();
  const { data: subjects } = useSubjects();
  const { data: goals } = useGoals();
  const { data: expenses } = useExpenses();
  const { data: health } = useHealthLogs();

  const taskRows = tasks ?? [];
  const done = taskRows.filter((task) => task.completed).length;
  const studyDone = (subjects ?? []).reduce((sum, row) => sum + Number(row.completed_hours), 0);
  const goalAvg = (goals ?? []).length
    ? (goals ?? []).reduce((sum, goal) => sum + goal.progress, 0) / (goals ?? []).length
    : 0;
  const spend = (expenses ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  const days = Array.from({ length: 10 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (9 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      day: shortDate(key),
      tasks: taskRows.filter((task) => task.due_date === key && task.completed).length,
      spend: (expenses ?? [])
        .filter((row) => row.spent_on === key)
        .reduce((sum, row) => sum + Number(row.amount), 0),
      sleep: Number((health ?? []).find((row) => row.log_date === key)?.sleep_hours ?? 0),
    };
  });

  return (
    <>
      <PageHeader eyebrow="Analytics" title="The whole picture" description="Ten days of momentum across every area." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatPill label="Tasks completed" value={`${done}/${taskRows.length}`} />
        <StatPill label="Study hours" value={`${studyDone}h`} />
        <StatPill label="Goal average" value={`${clampPercent(goalAvg)}%`} />
        <StatPill label="Total tracked spend" value={currency(spend)} />
      </div>

      <GlassCard className="mt-6">
        <SectionTitle title="Trends" subtitle="Completed tasks, daily spend and sleep hours." />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={days}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "rgba(12,14,28,0.9)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="tasks" stroke="#8b5cf6" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="spend" stroke="#3b82f6" fill="url(#g2)" strokeWidth={2} />
              <Area type="monotone" dataKey="sleep" stroke="#22d3ee" fill="url(#g3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </>
  );
}
