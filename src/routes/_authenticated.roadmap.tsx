import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Map, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Shimmer } from "@/components/ai-elements/shimmer";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLifeMetrics } from "@/hooks/use-life-metrics";
import { generateRoadmap } from "@/lib/ai.functions";
import { useRoadmap, useRoadmapMutations } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "30-Day Roadmap — LifeOS AI" },
      {
        name: "description",
        content:
          "An AI-generated 30-day placement preparation roadmap built from your target role, skill gaps and weekly study hours.",
      },
      { property: "og:title", content: "30-Day Roadmap — LifeOS AI" },
      { property: "og:description", content: "Your personalised day-by-day placement prep plan." },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const metrics = useLifeMetrics();
  const { data: rows } = useRoadmap();
  const { replace, toggle } = useRoadmapMutations();

  const generate = useMutation({
    mutationFn: async () => {
      const days = await generateRoadmap({
        data: {
          targetRole: metrics.role,
          weeklyHours: metrics.weeklyHours,
          skills: Object.entries(metrics.skills)
            .map(([name, level]) => `${name}=${level}`)
            .join(", "),
          gaps: metrics.gaps,
        },
      });
      if (!days.length) throw new Error("The AI returned an empty plan. Try again.");
      await replace.mutateAsync({ targetRole: metrics.role, days });
    },
    onSuccess: () => toast.success("Your 30-day roadmap is ready."),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not build the roadmap."),
  });

  const list = rows ?? [];
  const done = list.filter((row) => row.completed).length;
  const percent = list.length ? (done / list.length) * 100 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Study Roadmap"
        title="30 days, one topic at a time"
        description="Built from your target role, your skill gaps and the hours you actually have."
        action={
          <Button variant="hero" size="lg" onClick={() => generate.mutate()} disabled={generate.isPending}>
            <Wand2 className="size-4" />
            {list.length ? "Regenerate plan" : "Generate plan"}
          </Button>
        }
      />

      <GlassCard className="animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
            <p className="mt-1 text-2xl font-semibold">
              {done}/{list.length || 30} days complete
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Target role: <span className="text-foreground">{metrics.role}</span> ·{" "}
            {metrics.weeklyHours}h per week
          </p>
        </div>
        <Progress value={percent} className="mt-4 h-2" />
      </GlassCard>

      {generate.isPending ? (
        <GlassCard className="mt-4">
          <Shimmer>Designing your 30-day plan…</Shimmer>
        </GlassCard>
      ) : null}

      {!generate.isPending && list.length === 0 ? (
        <GlassCard className="mt-4 flex flex-col items-center py-14 text-center">
          <Map className="size-8 text-primary" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            No roadmap yet. Set your skills on the Career page, then generate a plan tailored to
            your gaps.
          </p>
        </GlassCard>
      ) : null}

      <SectionTitle title="" />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((row) => (
          <li key={row.id}>
            <GlassCard
              interactive
              className={cn("h-full", row.completed && "border-primary/40 bg-primary/5")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Day {row.day}
                  </p>
                  <p className="mt-1 font-semibold">{row.topic}</p>
                </div>
                <button
                  type="button"
                  aria-label={row.completed ? "Mark day incomplete" : "Mark day complete"}
                  onClick={() => toggle.mutate({ id: row.id, completed: !row.completed })}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {row.completed ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </button>
              </div>
              {row.focus ? (
                <p className="mt-3 text-sm text-muted-foreground">{row.focus}</p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">{Number(row.hours)}h focus</p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </>
  );
}
