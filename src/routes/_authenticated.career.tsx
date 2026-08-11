import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Compass, Map, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CircularProgress } from "@/components/app/CircularProgress";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { AiInsight } from "@/components/app/AiInsight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLifeMetrics } from "@/hooks/use-life-metrics";
import {
  LEVEL_LABEL,
  ROLES,
  ROLE_SKILLS,
  careerReadiness,
  type Role,
  type SkillLevel,
  type SkillMap,
} from "@/lib/career";
import { useSaveCareerProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/career")({
  head: () => ({
    meta: [
      { title: "Career Readiness — LifeOS AI" },
      {
        name: "description",
        content:
          "Pick your target placement role, map your current skills against what recruiters expect, and get an AI skill-gap roadmap.",
      },
      { property: "og:title", content: "Career Readiness — LifeOS AI" },
      { property: "og:description", content: "Skill gap analysis for your target placement role." },
    ],
  }),
  component: CareerPage,
});

const LEVELS: SkillLevel[] = ["strong", "learning", "missing"];

const LEVEL_ICON = {
  strong: Check,
  learning: AlertTriangle,
  missing: X,
} as const;

function CareerPage() {
  const metrics = useLifeMetrics();
  const save = useSaveCareerProfile();

  const [role, setRole] = useState<Role>(metrics.role);
  const [skills, setSkills] = useState<SkillMap>(metrics.skills);
  const [hours, setHours] = useState(String(metrics.weeklyHours));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    setRole(metrics.role);
    setSkills(metrics.skills);
    setHours(String(metrics.weeklyHours));
    if (Object.keys(metrics.skills).length) setHydrated(true);
  }, [hydrated, metrics.role, metrics.skills, metrics.weeklyHours]);

  const required = ROLE_SKILLS[role];
  const readiness = careerReadiness(role, skills);
  const gaps = required.filter((skill) => (skills[skill] ?? "missing") !== "strong");

  const persist = async () => {
    try {
      await save.mutateAsync({
        target_role: role,
        weekly_hours: Number(hours) || 10,
        skills: skills as Record<string, string>,
      });
      toast.success("Career profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your career profile.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Career Readiness"
        title="Target the role, close the gap"
        description="Mark where you stand on each recruiter-expected skill and see your readiness update live."
        action={
          <Button variant="hero" size="lg" onClick={persist} disabled={save.isPending}>
            <Compass className="size-4" />
            Save profile
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard>
          <SectionTitle title="Target role" subtitle="Your whole roadmap follows this choice." />
          <div className="flex flex-wrap gap-2">
            {ROLES.map((item) => (
              <Button
                key={item}
                variant={role === item ? "hero" : "glass"}
                size="sm"
                className="rounded-full"
                onClick={() => setRole(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="mt-5 max-w-xs space-y-2">
            <Label htmlFor="hours">Study hours available per week</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={80}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </div>

          <div className="mt-6">
            <SectionTitle title="Skill matrix" subtitle="Tap a level for each required skill." />
            <ul className="space-y-2">
              {required.map((skill) => {
                const level = skills[skill] ?? "missing";
                const Icon = LEVEL_ICON[level];
                return (
                  <li
                    key={skill}
                    className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5"
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        level === "strong" && "text-primary",
                        level === "learning" && "text-amber-400",
                        level === "missing" && "text-muted-foreground",
                      )}
                    />
                    <span className="flex-1 text-sm font-medium">{skill}</span>
                    <div className="flex gap-1">
                      {LEVELS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSkills((current) => ({ ...current, [skill]: option }))}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs transition-colors",
                            level === option
                              ? "bg-brand text-primary-foreground"
                              : "bg-background/40 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {LEVEL_LABEL[option]}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="flex flex-col items-center py-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Readiness for {role}
            </p>
            <CircularProgress value={readiness} size={150} thickness={12} className="mt-4" />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {gaps.length
                ? `${gaps.length} skill${gaps.length > 1 ? "s" : ""} still need work.`
                : "Every required skill is covered. Time for mock interviews."}
            </p>
            <Button variant="glass" className="mt-4 rounded-2xl" asChild>
              <Link to="/roadmap">
                <Map className="size-4" />
                Build my 30-day roadmap
              </Link>
            </Button>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Skill gaps" subtitle="Highest impact first." />
            {gaps.length ? (
              <ol className="space-y-2 text-sm">
                {gaps.map((skill, index) => (
                  <li key={skill} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="flex-1">{skill}</span>
                    <span className="text-xs text-muted-foreground">
                      {LEVEL_LABEL[skills[skill] ?? "missing"]}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No gaps left for this role.</p>
            )}
          </GlassCard>
        </div>
      </div>

      <div className="mt-4">
        <AiInsight
          kind="goals"
          title="AI skill-gap roadmap"
          context={`${metrics.aiContext}\nGive a prioritised skill-gap roadmap for becoming a ${role}, week by week for 4 weeks.`}
        />
      </div>
    </>
  );
}
