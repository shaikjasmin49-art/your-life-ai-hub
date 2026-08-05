import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CalendarClock, Compass, Mic, MicOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { GlassCard } from "@/components/app/GlassCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useThreadMessages, useThreadMutations } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  component: ThreadPage,
});

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data: rows } = useThreadMessages(threadId);
  const { rename } = useThreadMutations();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const initialMessages = useMemo<UIMessage[]>(
    () =>
      (rows ?? []).map((row) => ({
        id: row.message_id ?? row.id,
        role: row.role as UIMessage["role"],
        parts: (row.parts ?? []) as UIMessage["parts"],
      })),
    [rows],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "The assistant could not respond."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const send = async (text: string, nextMode?: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    if (messages.length === 0) {
      rename.mutate({ id: threadId, title: value.slice(0, 60) });
    }
    await sendMessage({ text: value }, { body: { threadId, mode: nextMode ?? mode } });
  };

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <GlassCard className="flex min-h-[70vh] flex-col p-0">
      <div className="flex flex-wrap gap-2 border-b border-border p-3">
        <Button
          variant={mode === "planner" ? "hero" : "glass"}
          size="sm"
          className="rounded-full"
          onClick={() => setMode(mode === "planner" ? null : "planner")}
        >
          <CalendarClock className="size-4" />
          Daily planner
        </Button>
        <Button
          variant={mode === "career" ? "hero" : "glass"}
          size="sm"
          className="rounded-full"
          onClick={() => setMode(mode === "career" ? null : "career")}
        >
          <Compass className="size-4" />
          Career guidance
        </Button>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <MessageResponse key={index}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-3">
        <PromptInput
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === "career" ? "Ask about your career path…" : "Ask anything about your day…"}
          />
          <PromptInputFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              onClick={toggleVoice}
            >
              {listening ? <MicOff className="size-4 text-destructive" /> : <Mic className="size-4" />}
            </Button>
            <PromptInputSubmit status={status} disabled={busy || !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </GlassCard>
  );
}
