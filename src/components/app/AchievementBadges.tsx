import type { Badge as BadgeType } from "@/lib/career";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { cn } from "@/lib/utils";

export function AchievementBadges({ badges }: { badges: BadgeType[] }) {
  const unlocked = badges.filter((badge) => badge.unlocked).length;

  return (
    <GlassCard>
      <SectionTitle
        title="Achievements"
        subtitle={`${unlocked} of ${badges.length} unlocked`}
      />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300",
              badge.unlocked
                ? "border-primary/40 bg-primary/10 shadow-[0_14px_36px_-24px_var(--primary)]"
                : "border-border bg-secondary/30 opacity-60",
            )}
          >
            <span className={cn("text-2xl", badge.unlocked ? "animate-pop" : "grayscale")}>
              {badge.emoji}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{badge.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {badge.unlocked ? "Unlocked" : badge.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
