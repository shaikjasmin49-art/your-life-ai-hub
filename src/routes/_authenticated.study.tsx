import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiInsight } from "@/components/app/AiInsight";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { clampPercent } from "@/lib/format";
import { useSubjectMutations, useSubjects } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({
    meta: [
      { title: "Study Planner — LifeOS AI" },
      {
        name: "description",
        content: "Track subjects, log study hours and get AI recommendations on what to study next.",
      },
      { property: "og:title", content: "Study Planner — LifeOS AI" },
      { property: "og:description", content: "Subject progress and AI study recommendations." },
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  const { data: subjects } = useSubjects();
  const { add, logHours, remove } = useSubjectMutations();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("10");

  const rows = subjects ?? [];
  const totalTarget = rows.reduce((sum, row) => sum + Number(row.target_hours), 0);
  const totalDone = rows.reduce((sum, row) => sum + Number(row.completed_hours), 0);

  const context = rows.length
    ? rows
        .map((row) => `${row.name}: ${row.completed_hours}h done of ${row.target_hours}h target`)
        .join("\n")
    : "";

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await add.mutateAsync({ name: name.trim(), target_hours: Number(target) || 10 });
      setName("");
      setTarget("10");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the subject.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Study Planner"
        title="Learn on purpose"
        description={`${totalDone} of ${totalTarget || 0} planned hours logged across ${rows.length} subject${rows.length === 1 ? "" : "s"}.`}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Add a subject" subtitle="Set a weekly hour target." />
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleAdd}>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Data structures"
                aria-label="Subject name"
              />
              <Input
                type="number"
                min={1}
                max={200}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="sm:w-28"
                aria-label="Target hours"
              />
              <Button type="submit" variant="hero" disabled={add.isPending}>
                <Plus className="size-4" />
                Add
              </Button>
            </form>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Progress" subtitle="Log hours as you go." />
            <ul className="space-y-4">
              {rows.map((row) => {
                const percent = clampPercent(
                  (Number(row.completed_hours) / Math.max(1, Number(row.target_hours))) * 100,
                );
                return (
                  <li key={row.id} className="rounded-2xl bg-secondary/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.completed_hours}h of {row.target_hours}h · {percent}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove an hour from ${row.name}`}
                          onClick={() =>
                            logHours.mutate({
                              id: row.id,
                              completed_hours: Math.max(0, Number(row.completed_hours) - 1),
                            })
                          }
                        >
                          <Minus className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Add an hour to ${row.name}`}
                          onClick={() =>
                            logHours.mutate({
                              id: row.id,
                              completed_hours: Number(row.completed_hours) + 1,
                            })
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => remove.mutate(row.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={percent} className="mt-3 h-1.5" />
                  </li>
                );
              })}
              {rows.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No subjects yet. Add one to start tracking.
                </li>
              ) : null}
            </ul>
          </GlassCard>
        </div>

        <AiInsight
          kind="study"
          title="AI study recommendations"
          context={context}
          disabled={!context}
        />
      </div>
    </>
  );
}
