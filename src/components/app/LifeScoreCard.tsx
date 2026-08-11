import { GlassCard } from "@/components/app/GlassCard";
import { CircularProgress } from "@/components/app/CircularProgress";
import { Progress } from "@/components/ui/progress";
import type { LifeScoreInput } from "@/lib/career";

const LABELS: Record<keyof LifeScoreInput, string> = {
  careerReadiness: "Career Readiness",
  studyProgress: "Study Progress",
  placementReadiness: "Placement Readiness",
  goals: "Goals",
  productivity: "Productivity",
};

export function LifeScoreCard({
  total,
  breakdown,
}: {
  total: number;
  breakdown: LifeScoreInput;
}) {
  return (
    <GlassCard className="animate-fade-up overflow-hidden p-6">
      <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your Life Score</p>
          <div className="relative mt-4">
            <div className="absolute inset-0 -z-10 rounded-full bg-brand opacity-25 blur-2xl" />
            <CircularProgress
              value={total}
              size={188}
              thickness={14}
              label={`${total}`}
              caption="out of 100"
            />
          </div>
          <p className="mt-4 max-w-[15rem] text-center text-sm text-muted-foreground">
            {total >= 80
              ? "You're placement-ready. Keep the streak alive."
              : total >= 60
                ? "Strong base — close your skill gaps next."
                : "Early days. Follow today's AI insight to move fast."}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {(Object.keys(LABELS) as (keyof LifeScoreInput)[]).map((key) => (
            <div key={key} className="flex flex-col items-center text-center">
              <CircularProgress value={breakdown[key]} size={84} thickness={7} />
              <p className="mt-2 text-xs font-medium text-muted-foreground">{LABELS[key]}</p>
              <Progress value={breakdown[key]} className="mt-2 h-1 w-full max-w-[7rem]" />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
