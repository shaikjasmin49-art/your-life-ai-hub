import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InsightInput = z.object({
  kind: z.enum(["study", "spending", "health", "goals"]),
  context: z.string().min(1).max(6000),
});

const ResumeInput = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileData: z.string().min(10),
  targetRole: z.string().max(120).optional(),
});

const DailyInsightInput = z.object({ context: z.string().min(1).max(6000) });

const RoadmapInput = z.object({
  targetRole: z.string().min(1).max(120),
  weeklyHours: z.number().min(1).max(80),
  skills: z.string().max(2000),
  gaps: z.array(z.string().max(80)).max(20),
});

const QuestionInput = z.object({
  targetRole: z.string().min(1).max(120),
  asked: z.array(z.string().max(400)).max(20),
  skills: z.string().max(2000),
});

const FeedbackInput = z.object({
  targetRole: z.string().min(1).max(120),
  question: z.string().min(1).max(600),
  answer: z.string().min(1).max(4000),
});

const SummaryInput = z.object({
  targetRole: z.string().min(1).max(120),
  transcript: z.string().min(1).max(12000),
});

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InsightInput.parse(input))
  .handler(async ({ data }) => {
    const { runInsights } = await import("./ai-features.server");
    return runInsights(data.kind, data.context);
  });

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResumeInput.parse(input))
  .handler(async ({ data }) => {
    const { runResumeAnalysis } = await import("./ai-features.server");
    return runResumeAnalysis(data);
  });

export const dailyInsight = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DailyInsightInput.parse(input))
  .handler(async ({ data }) => {
    const { runDailyInsight } = await import("./ai-features.server");
    return runDailyInsight(data.context);
  });

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RoadmapInput.parse(input))
  .handler(async ({ data }) => {
    const { runRoadmap } = await import("./ai-features.server");
    return runRoadmap(data);
  });

export const interviewQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuestionInput.parse(input))
  .handler(async ({ data }) => {
    const { runInterviewQuestion } = await import("./ai-features.server");
    return runInterviewQuestion(data);
  });

export const interviewFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data }) => {
    const { runAnswerFeedback } = await import("./ai-features.server");
    return runAnswerFeedback(data);
  });

export const interviewSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const { runInterviewSummary } = await import("./ai-features.server");
    return runInterviewSummary(data);
  });
