import { useMutation } from "@tanstack/react-query";
import { HelpCircle, Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Shimmer } from "@/components/ai-elements/shimmer";
import { GlassCard } from "@/components/app/GlassCard";
import { Button } from "@/components/ui/button";
import { dailyInsight } from "@/lib/ai.functions";
import { useTaskMutations } from "@/lib/queries";

export function DailyInsightCard({ context, disabled }: { context: string; disabled?: boolean }) {
  const { add } = useTaskMutations();
  const [showReason, setShowReason] = useState(false);

  const insight = useMutation({
    mutationFn: async () => dailyInsight({ data: { context } }),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "The AI could not respond."),
  });

  const data = insight.data;

  const startTask = async () => {
    if (!data?.taskTitle) return;
    try {
      await add.mutateAsync({ title: data.taskTitle, priority: "high" });
      toast.success("Added to today's tasks.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the task.");
    }
  };

  return (
    <GlassCard className="animate-fade-up relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand opacity-20 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Today's AI Insight
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {data?.headline ?? "What should you fix today?"}
          </h2>
        </div>
        <Button
          variant="hero"
          size="sm"
          className="rounded-full"
          onClick={() => {
            setShowReason(false);
            insight.mutate();
          }}
          disabled={disabled || insight.isPending}
        >
          <Sparkles className="size-4" />
          {data ? "Refresh" : "Generate"}
        </Button>
      </div>

      <div className="mt-4 text-sm">
        {insight.isPending ? <Shimmer>Reading your progress…</Shimmer> : null}
        {!insight.isPending && !data ? (
          <p className="text-muted-foreground">
            {disabled
              ? "Add a few tasks, subjects or skills and the AI will have something to work with."
              : "Generate a personalised recommendation from your skills, study progress and placement pipeline."}
          </p>
        ) : null}
        {!insight.isPending && data ? (
          <div className="space-y-4">
            <p className="text-base leading-relaxed">{data.insight}</p>
            {data.taskTitle ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recommended task
                </p>
                <p className="mt-1 font-medium">{data.taskTitle}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="hero"
                size="sm"
                className="rounded-full"
                onClick={startTask}
                disabled={!data.taskTitle || add.isPending}
              >
                <Play className="size-4" />
                Start recommended task
              </Button>
              <Button
                variant="glass"
                size="sm"
                className="rounded-full"
                onClick={() => setShowReason((value) => !value)}
              >
                <HelpCircle className="size-4" />
                Ask AI why?
              </Button>
            </div>
            {showReason && data.reason ? (
              <p className="animate-fade-up rounded-2xl bg-secondary/40 px-4 py-3 text-muted-foreground">
                {data.reason}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
