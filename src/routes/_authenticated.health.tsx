import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";

import { AiInsight } from "@/components/app/AiInsight";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shortDate, today } from "@/lib/format";
import { useHealthLogs, useUpsertHealthLog } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/health")({
  head: () => ({
    meta: [
      { title: "Health Tracker — LifeOS AI" },
      {
        name: "description",
        content: "Log water, sleep and steps each day and get AI wellbeing tips from your trends.",
      },
      { property: "og:title", content: "Health Tracker — LifeOS AI" },
      { property: "og:description", content: "Water, sleep and steps with AI wellbeing tips." },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const { data: logs } = useHealthLogs();
  const upsert = useUpsertHealthLog();
  const rows = logs ?? [];
  const todayLog = rows.find((row) => row.log_date === today());

  const [water, setWater] = useState(String(todayLog?.water_glasses ?? 0));
  const [sleep, setSleep] = useState(String(todayLog?.sleep_hours ?? 0));
  const [steps, setSteps] = useState(String(todayLog?.steps ?? 0));

  const chart = [...rows]
    .reverse()
    .slice(-10)
    .map((row) => ({
      day: shortDate(row.log_date),
      water: row.water_glasses,
      sleep: Number(row.sleep_hours),
      steps: Math.round(row.steps / 1000),
    }));

  const context = rows
    .slice(0, 14)
    .map((row) => `${row.log_date}: ${row.water_glasses} glasses water, ${row.sleep_hours}h sleep, ${row.steps} steps`)
    .join("\n");

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await upsert.mutateAsync({
        log_date: today(),
        water_glasses: Number(water) || 0,
        sleep_hours: Number(sleep) || 0,
        steps: Number(steps) || 0,
      });
      toast.success("Today's health log saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the log.");
    }
  };

  return (
    <>
      <PageHeader eyebrow="Health Tracker" title="Body first" description="Water, sleep and movement — logged daily." />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Log today" />
            <form className="grid gap-3 sm:grid-cols-3" onSubmit={handleSave}>
              <div className="space-y-2">
                <Label htmlFor="water">Water (glasses)</Label>
                <Input id="water" type="number" min="0" max="30" value={water} onChange={(e) => setWater(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep">Sleep (hours)</Label>
                <Input id="sleep" type="number" min="0" max="24" step="0.5" value={sleep} onChange={(e) => setSleep(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">Steps</Label>
                <Input id="steps" type="number" min="0" max="100000" value={steps} onChange={(e) => setSteps(e.target.value)} />
              </div>
              <Button type="submit" variant="hero" className="sm:col-span-3" disabled={upsert.isPending}>
                Save today
              </Button>
            </form>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Last 10 days" subtitle="Steps shown in thousands." />
            {chart.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(12,14,28,0.9)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14,
                      }}
                    />
                    <Bar dataKey="water" fill="#3b82f6" radius={6} />
                    <Bar dataKey="sleep" fill="#8b5cf6" radius={6} />
                    <Bar dataKey="steps" fill="#22d3ee" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Log a day to see your trend.</p>
            )}
          </GlassCard>
        </div>

        <AiInsight kind="health" title="AI health tips" context={context} disabled={!context} />
      </div>
    </>
  );
}
