import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, Send, Sparkles, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Shimmer } from "@/components/ai-elements/shimmer";
import { CircularProgress } from "@/components/app/CircularProgress";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLifeMetrics } from "@/hooks/use-life-metrics";
import { interviewFeedback, interviewQuestion, interviewSummary } from "@/lib/ai.functions";
import { ROLES, type Role } from "@/lib/career";
import { shortDate } from "@/lib/format";
import { useInterviewMutations, useInterviewSessions } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({
    meta: [
      { title: "AI Mock Interview — LifeOS AI" },
      {
        name: "description",
        content:
          "Practise placement interviews with an AI interviewer that scores technical accuracy, communication, confidence and completeness.",
      },
      { property: "og:title", content: "AI Mock Interview — LifeOS AI" },
      { property: "og:description", content: "Role-specific mock interviews with instant AI scoring." },
    ],
  }),
  component: InterviewPage,
});

type Turn = {
  question: string;
  answer: string;
  technical: number;
  communication: number;
  confidence: number;
  completeness: number;
  feedback: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const TOTAL_QUESTIONS = 5;

function InterviewPage() {
  const metrics = useLifeMetrics();
  const { data: history } = useInterviewSessions();
  const { save } = useInterviewMutations();

  const [role, setRole] = useState<Role>(metrics.role);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [summary, setSummary] = useState<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
  } | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const skillText = Object.entries(metrics.skills)
    .map(([name, level]) => `${name}=${level}`)
    .join(", ");

  const ask = useMutation({
    mutationFn: async (asked: string[]) =>
      interviewQuestion({ data: { targetRole: role, asked, skills: skillText } }),
    onSuccess: (result) => setQuestion(result.question),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not fetch a question."),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!question || !answer.trim()) return null;
      const scores = await interviewFeedback({
        data: { targetRole: role, question, answer: answer.trim() },
      });
      const turn: Turn = { question, answer: answer.trim(), ...scores };
      const nextTurns = [...turns, turn];
      setTurns(nextTurns);
      setAnswer("");

      if (nextTurns.length >= TOTAL_QUESTIONS) {
        const transcript = nextTurns
          .map(
            (item, index) =>
              `Q${index + 1}: ${item.question}\nA: ${item.answer}\nScores — technical ${item.technical}, communication ${item.communication}, confidence ${item.confidence}, completeness ${item.completeness}`,
          )
          .join("\n\n");
        const report = await interviewSummary({ data: { targetRole: role, transcript } });
        setSummary(report);
        setQuestion(null);
        await save.mutateAsync({
          target_role: role,
          turns: nextTurns,
          overall_score: report.overallScore,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          recommended_topics: report.recommendedTopics,
        });
        return null;
      }

      await ask.mutateAsync(nextTurns.map((item) => item.question));
      return null;
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not grade that answer."),
  });

  const start = () => {
    setTurns([]);
    setSummary(null);
    setAnswer("");
    ask.mutate([]);
  };

  const toggleVoice = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;
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
      setAnswer((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const busy = ask.isPending || submit.isPending;
  const last = turns[turns.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="AI Mock Interview"
        title="Rehearse before it counts"
        description="Five role-specific questions, scored on technical accuracy, communication, confidence and completeness."
        action={
          <Button variant="hero" size="lg" onClick={start} disabled={busy}>
            <Sparkles className="size-4" />
            {turns.length || summary ? "Restart round" : "Start interview"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <GlassCard>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((item) => (
              <Button
                key={item}
                variant={role === item ? "hero" : "glass"}
                size="sm"
                className="rounded-full"
                onClick={() => setRole(item)}
                disabled={busy || turns.length > 0}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="mt-5">
            <Progress value={(turns.length / TOTAL_QUESTIONS) * 100} className="h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              Question {Math.min(turns.length + (question ? 1 : 0), TOTAL_QUESTIONS)} of{" "}
              {TOTAL_QUESTIONS}
            </p>
          </div>

          {busy ? <Shimmer>The interviewer is thinking…</Shimmer> : null}

          {!busy && question ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Interviewer</p>
                <p className="mt-1 text-base">{question}</p>
              </div>
              <Textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer, or use the mic…"
                className="min-h-32 rounded-2xl"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  className="rounded-full"
                  onClick={toggleVoice}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                >
                  {listening ? <MicOff className="size-4 text-destructive" /> : <Mic className="size-4" />}
                  {listening ? "Listening…" : "Voice answer"}
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  className="rounded-full"
                  onClick={() => submit.mutate()}
                  disabled={!answer.trim()}
                >
                  <Send className="size-4" />
                  Submit answer
                </Button>
              </div>
            </div>
          ) : null}

          {!busy && !question && !summary ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Pick a role and start the round. Answers stay private to your account.
            </p>
          ) : null}

          {!busy && last ? (
            <div className="mt-6">
              <SectionTitle title="Last answer feedback" />
              <div className="grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ["Technical", last.technical],
                    ["Communication", last.communication],
                    ["Confidence", last.confidence],
                    ["Completeness", last.completeness],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col items-center">
                    <CircularProgress value={value} size={72} thickness={6} />
                    <p className="mt-2 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {last.feedback ? (
                <p className="mt-4 rounded-2xl bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                  {last.feedback}
                </p>
              ) : null}
            </div>
          ) : null}
        </GlassCard>

        <div className="space-y-4">
          {summary ? (
            <GlassCard className="animate-fade-up">
              <SectionTitle title="Interview report" />
              <div className="flex flex-col items-center">
                <CircularProgress value={summary.overallScore} size={140} thickness={12} />
                <p className="mt-3 text-sm text-muted-foreground">Overall interview score</p>
              </div>
              <ReportList title="Strengths" items={summary.strengths} />
              <ReportList title="Weaknesses" items={summary.weaknesses} />
              <ReportList title="Recommended topics" items={summary.recommendedTopics} />
            </GlassCard>
          ) : null}

          <GlassCard>
            <SectionTitle title="Past rounds" />
            {(history ?? []).length ? (
              <ul className="divide-y divide-border text-sm">
                {(history ?? []).map((row) => (
                  <li key={row.id} className="flex items-center gap-3 py-2.5">
                    <Trophy className="size-4 text-primary" />
                    <span className="flex-1 truncate">{row.target_role}</span>
                    <span className="text-xs text-muted-foreground">{shortDate(row.created_at)}</span>
                    <span className="font-medium">{row.overall_score ?? "—"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No mock interviews yet.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-secondary/40 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
