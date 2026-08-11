import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shortDate, today } from "@/lib/format";
import { usePlacementMutations, usePlacements } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/placements")({
  head: () => ({
    meta: [
      { title: "Placement Tracker — LifeOS AI" },
      {
        name: "description",
        content:
          "Track every campus placement application: company, role, assessment and interview dates, and current status.",
      },
      { property: "og:title", content: "Placement Tracker — LifeOS AI" },
      { property: "og:description", content: "Your campus placement pipeline in one place." },
    ],
  }),
  component: PlacementsPage,
});

const STATUSES = ["applied", "assessment", "interview", "selected", "rejected"] as const;

const STATUS_STYLE: Record<string, string> = {
  applied: "bg-secondary text-foreground",
  assessment: "bg-amber-500/20 text-amber-300",
  interview: "bg-primary/20 text-primary",
  selected: "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-destructive/20 text-destructive",
};

function PlacementsPage() {
  const { data: rows } = usePlacements();
  const { add, setStatus, remove } = usePlacementMutations();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [appliedOn, setAppliedOn] = useState(today());
  const [assessmentOn, setAssessmentOn] = useState("");
  const [interviewOn, setInterviewOn] = useState("");
  const [status, setStatusValue] = useState<string>("applied");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company.trim() || !role.trim()) return;
    try {
      await add.mutateAsync({
        company: company.trim(),
        role: role.trim(),
        applied_on: appliedOn || today(),
        status,
        assessment_on: assessmentOn || null,
        interview_on: interviewOn || null,
      });
      setCompany("");
      setRole("");
      setAssessmentOn("");
      setInterviewOn("");
      setStatusValue("applied");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that application.");
    }
  };

  const counts = STATUSES.map((value) => ({
    value,
    count: (rows ?? []).filter((row) => row.status === value).length,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Placement Tracker"
        title="Every application, one pipeline"
        description="Know exactly which company is at which stage — and what's coming up this week."
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {counts.map((item) => (
          <GlassCard key={item.value} className="py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.value}</p>
            <p className="mt-1 text-2xl font-semibold">{item.count}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard>
          <SectionTitle title="Add an application" />
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Zoho" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prole">Role</Label>
              <Input id="prole" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Software Engineer" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="applied">Applied on</Label>
                <Input id="applied" type="date" value={appliedOn} onChange={(event) => setAppliedOn(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment</Label>
                <Input id="assessment" type="date" value={assessmentOn} onChange={(event) => setAssessmentOn(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview">Interview</Label>
                <Input id="interview" type="date" value={interviewOn} onChange={(event) => setInterviewOn(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatusValue(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full rounded-2xl" disabled={add.isPending}>
              <Plus className="size-4" />
              Add application
            </Button>
          </form>
        </GlassCard>

        <div className="space-y-3">
          {(rows ?? []).length === 0 ? (
            <GlassCard className="py-12 text-center text-sm text-muted-foreground">
              No applications yet. Add your first company on the left.
            </GlassCard>
          ) : null}
          {(rows ?? []).map((row) => (
            <GlassCard key={row.id} interactive className="animate-fade-up">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-brand text-sm font-semibold text-primary-foreground">
                    {row.company.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold">{row.company}</p>
                    <p className="text-sm text-muted-foreground">{row.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize",
                      STATUS_STYLE[row.status] ?? "bg-secondary",
                    )}
                  >
                    {row.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete application"
                    onClick={() => remove.mutate(row.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Applied</dt>
                  <dd>{shortDate(row.applied_on)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Assessment</dt>
                  <dd>{row.assessment_on ? shortDate(row.assessment_on) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Interview</dt>
                  <dd>{row.interview_on ? shortDate(row.interview_on) : "—"}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {STATUSES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus.mutate({ id: row.id, status: value })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs capitalize transition-colors",
                      row.status === value
                        ? "bg-brand text-primary-foreground"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Briefcase className="size-3.5" />
        Your applications are private to your account.
      </p>
    </>
  );
}
