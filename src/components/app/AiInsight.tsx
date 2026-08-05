import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

import { GlassCard } from "@/components/app/GlassCard";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { generateInsights } from "@/lib/ai.functions";

type Kind = "study" | "spending" | "health" | "goals";

export function AiInsight({
  kind,
  title,
  context,
  disabled,
}: {
  kind: Kind;
  title: string;
  context: string;
  disabled?: boolean;
}) {
  const insight = useMutation({
    mutationFn: async () => {
      const result = await generateInsights({ data: { kind, context } });
      return result.text;
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "The AI could not respond."),
  });

  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">Personalised to the data on this page.</p>
        </div>
        <Button
          variant="hero"
          size="sm"
          className="rounded-full"
          onClick={() => insight.mutate()}
          disabled={disabled || insight.isPending}
        >
          <Sparkles className="size-4" />
          {insight.data ? "Refresh" : "Generate"}
        </Button>
      </div>

      <div className="mt-4 text-sm">
        {insight.isPending ? <Shimmer>Thinking…</Shimmer> : null}
        {!insight.isPending && insight.data ? (
          <div className="prose-invert space-y-2 [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
            <Streamdown>{insight.data}</Streamdown>
          </div>
        ) : null}
        {!insight.isPending && !insight.data ? (
          <p className="text-muted-foreground">
            {disabled
              ? "Add a little data first and the AI will have something to work with."
              : "Generate AI insights whenever you want a second opinion."}
          </p>
        ) : null}
      </div>
    </GlassCard>
  );
}
