import { createFileRoute } from "@tanstack/react-router";

import { GlassCard } from "@/components/app/GlassCard";
import mark from "@/assets/lifeos-mark.png";

export const Route = createFileRoute("/_authenticated/assistant/")({
  component: () => (
    <GlassCard className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <img src={mark} alt="" className="size-16 rounded-2xl animate-float" />
      <h1 className="mt-6 text-2xl font-semibold">
        Ask <span className="text-gradient">LifeOS AI</span>
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start a new conversation to plan your day, get career guidance or think out loud — by text or
        voice.
      </p>
    </GlassCard>
  ),
});
