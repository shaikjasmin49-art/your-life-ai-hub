import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/app/GlassCard";
import { Button } from "@/components/ui/button";
import { useThreadMutations, useThreads } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — LifeOS AI" },
      {
        name: "description",
        content: "Chat with LifeOS AI by voice or text for daily plans and career guidance.",
      },
      { property: "og:title", content: "AI Assistant — LifeOS AI" },
      { property: "og:description", content: "Voice-ready AI chat for planning and career guidance." },
    ],
  }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const { data: threads } = useThreads();
  const { create, remove } = useThreadMutations();
  const navigate = useNavigate();

  const newThread = async () => {
    try {
      const id = await create.mutateAsync(undefined);
      await navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start a conversation.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <GlassCard className="h-fit">
        <Button variant="hero" className="w-full rounded-2xl" onClick={newThread} disabled={create.isPending}>
          <Plus className="size-4" />
          New conversation
        </Button>
        <ul className="mt-3 space-y-1">
          {(threads ?? []).map((thread) => (
            <li key={thread.id} className="group flex items-center gap-1">
              <Link
                to="/assistant/$threadId"
                params={{ threadId: thread.id }}
                activeProps={{ className: "bg-secondary/70 text-foreground" }}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50"
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate">{thread.title}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${thread.title}`}
                className="opacity-0 group-hover:opacity-100"
                onClick={() => remove.mutate(thread.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
          {(threads ?? []).length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</li>
          ) : null}
        </ul>
      </GlassCard>

      <Outlet />
    </div>
  );
}
