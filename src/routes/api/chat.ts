import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  CHAT_MODEL,
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  requireLovableApiKey,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { getUserFromRequest } from "@/lib/supabase-auth.server";

type ChatRequestBody = {
  messages?: unknown;
  threadId?: unknown;
  mode?: unknown;
};

const MODE_PROMPTS: Record<string, string> = {
  planner:
    "The user wants a daily plan. Produce a realistic, time-blocked schedule for today with focus blocks, breaks, and one stretch goal. Keep it tight and actionable.",
  career:
    "The user wants career guidance. Give concrete, prioritised advice: skills to build, portfolio moves, and a 30-day action plan.",
};

const SYSTEM_PROMPT = [
  "You are LifeOS AI, a warm but sharp personal life operating system assistant.",
  "You help with productivity, study planning, goals, money habits, careers and health.",
  "Be concise and specific. Use short markdown sections and bullet lists over long paragraphs.",
  "Never invent personal data about the user — ask for it when you need it.",
  "You are not a doctor or a licensed financial adviser; flag that when advice gets serious.",
].join(" ");

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        const mode = typeof body.mode === "string" ? body.mode : null;

        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const auth = await getUserFromRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        if (threadId) {
          const { data: thread } = await auth.supabase
            .from("chat_threads")
            .select("id")
            .eq("id", threadId)
            .maybeSingle();
          if (!thread) return new Response("Thread not found", { status: 404 });
        }

        const key = requireLovableApiKey();
        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);

        const uiMessages = messages as UIMessage[];
        const system = mode && MODE_PROMPTS[mode] ? `${SYSTEM_PROMPT} ${MODE_PROMPTS[mode]}` : SYSTEM_PROMPT;

        const result = streamText({
          model: gateway(CHAT_MODEL),
          system,
          messages: convertToModelMessages(uiMessages),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
          onFinish: async ({ responseMessage }) => {
            if (!threadId) return;
            const lastUser = [...uiMessages].reverse().find((message) => message.role === "user");
            const rows = [] as {
              thread_id: string;
              user_id: string;
              role: string;
              message_id: string | null;
              parts: unknown;
            }[];
            if (lastUser) {
              rows.push({
                thread_id: threadId,
                user_id: auth.userId,
                role: "user",
                message_id: lastUser.id ?? null,
                parts: lastUser.parts,
              });
            }
            rows.push({
              thread_id: threadId,
              user_id: auth.userId,
              role: responseMessage.role,
              message_id: responseMessage.id ?? null,
              parts: responseMessage.parts,
            });

            const { error } = await auth.supabase.from("chat_messages").insert(rows);
            if (error) console.error("[chat] failed to persist messages", error);

            const { error: touchError } = await auth.supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
            if (touchError) console.error("[chat] failed to touch thread", touchError);
          },
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
