import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiInsight } from "@/components/app/AiInsight";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { shortDate } from "@/lib/format";
import { useGoalMutations, useGoals } from "@/lib/queries";

const CATEGORIES = ["career", "learning", "health", "finance", "personal"];

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goal Tracker — LifeOS AI" },
      {
        name: "description",
        content: "Set long-term goals, move the progress slider and let AI spot what's at risk.",
      },
      { property: "og:title", content: "Goal Tracker — LifeOS AI" },
      { property: "og:description", content: "Long-term goals with AI momentum coaching." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals } = useGoals();
  const { add, setProgress, remove } = useGoalMutations();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("career");
  const [targetDate, setTargetDate] = useState("");

  const rows = goals ?? [];
  const context = rows.length
    ? rows
        .map(
          (goal) =>
            `${goal.title} (${goal.category}) — ${goal.progress}% done${goal.target_date ? `, due ${goal.target_date}` : ""}`,
        )
        .join("\n")
    : "";

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await add.mutateAsync({
        title: title.trim(),
        category,
        target_date: targetDate || null,
      });
      setTitle("");
      setTargetDate("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the goal.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Goal Tracker"
        title="Where you're headed"
        description="Big goals, honest progress. Update as you move."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="New goal" />
            <form className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_auto]" onSubmit={handleAdd}>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ship my portfolio site"
                aria-label="Goal title"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                aria-label="Target date"
              />
              <Button type="submit" variant="hero" disabled={add.isPending}>
                <Plus className="size-4" />
              </Button>
            </form>
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((goal) => (
              <GlassCard key={goal.id} interactive>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{goal.title}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {goal.category}
                      {goal.target_date ? ` · ${shortDate(goal.target_date)}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${goal.title}`}
                    onClick={() => remove.mutate(goal.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Progress value={goal.progress} className="mt-4 h-1.5" />
                <div className="mt-3 flex items-center gap-3">
                  <Slider
                    value={[goal.progress]}
                    max={100}
                    step={5}
                    aria-label={`${goal.title} progress`}
                    onValueChange={([value]) =>
                      setProgress.mutate({ id: goal.id, progress: value ?? 0 })
                    }
                  />
                  <span className="w-10 text-right text-sm text-muted-foreground">
                    {goal.progress}%
                  </span>
                </div>
              </GlassCard>
            ))}
            {rows.length === 0 ? (
              <GlassCard className="sm:col-span-2 text-center text-sm text-muted-foreground">
                No goals yet — add the first one above.
              </GlassCard>
            ) : null}
          </div>
        </div>

        <AiInsight kind="goals" title="AI momentum check" context={context} disabled={!context} />
      </div>
    </>
  );
}
