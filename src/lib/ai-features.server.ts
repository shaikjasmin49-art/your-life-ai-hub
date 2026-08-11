import { streamText } from "ai";

import {
  CHAT_MODEL,
  createLovableAiGatewayProvider,
  requireLovableApiKey,
} from "./ai-gateway.server";

const INSIGHT_PROMPTS = {
  study:
    "You are a study coach. Given the learner's subjects and progress, give 3 short recommendations: what to prioritise today, a realistic weekly hour split, and one technique to retain more.",
  spending:
    "You are a pragmatic money coach. Given recent expenses, point out the top spending pattern, one leak worth cutting, and a simple budget target. Use the same currency symbol the data uses.",
  health:
    "You are a wellbeing coach. Given water, sleep and step logs, give 3 short, specific tips. Add a one-line reminder that this is not medical advice.",
  goals:
    "You are an execution coach. Given the user's goals and progress, name the goal at risk, the next concrete action for it, and one habit that would unblock momentum.",
} as const;

export type InsightKind = keyof typeof INSIGHT_PROMPTS;

export async function runInsights(kind: InsightKind, context: string) {
  const key = requireLovableApiKey();
  const gateway = createLovableAiGatewayProvider(key);

  const result = streamText({
    model: gateway(CHAT_MODEL),
    system: `${INSIGHT_PROMPTS[kind]} Answer in markdown with at most 120 words. Use bullet points. Never invent data that is not provided.`,
    prompt: context,
  });

  return { text: await result.text };
}

export type ResumeAnalysis = {
  atsScore: number;
  summary: string;
  missingSkills: string[];
  suggestions: string[];
  strengths: string[];
  missingKeywords: string[];
  projectIdeas: string[];
};

const RESUME_INSTRUCTIONS = [
  "You are an ATS (applicant tracking system) resume auditor.",
  "Read the attached resume and return ONLY minified JSON, no markdown fences, with this exact shape:",
  '{"atsScore": number 0-100, "summary": string, "strengths": string[], "missingSkills": string[], "missingKeywords": string[], "projectIdeas": string[], "suggestions": string[]}',
  "atsScore reflects parseability, keyword coverage, quantified impact and structure.",
  "summary: max 40 words. missingSkills: 3-8 concrete skills/keywords. suggestions: 4-6 rewrite actions.",
  "strengths: 3-5 things the resume already does well. missingKeywords: 4-8 ATS keywords absent for the target role.",
  "projectIdeas: 2-4 portfolio projects that would close the biggest gaps, each max 90 chars.",
].join(" ");

export async function runResumeAnalysis(input: {
  fileName: string;
  mimeType: string;
  fileData: string;
  targetRole?: string | undefined;
}): Promise<ResumeAnalysis> {
  const key = requireLovableApiKey();

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: RESUME_INSTRUCTIONS },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: input.targetRole
                ? `Audit this resume for the role: ${input.targetRole}. Return JSON only.`
                : "Audit this resume. Return JSON only.",
            },
            {
              type: "file",
              file: {
                filename: input.fileName,
                file_data: `data:${input.mimeType};base64,${input.fileData}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[resume] gateway failed [${response.status}]: ${body}`);
    if (response.status === 429) throw new Error("AI is rate limited right now. Try again shortly.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`Resume analysis failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  return parseResumeAnalysis(raw);
}

function parseResumeAnalysis(raw: string): ResumeAnalysis {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response could not be read. Try again.");

  const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<ResumeAnalysis>;
  const toStrings = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

  return {
    atsScore: Math.max(0, Math.min(100, Math.round(Number(parsed.atsScore) || 0))),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    missingSkills: toStrings(parsed.missingSkills).slice(0, 10),
    suggestions: toStrings(parsed.suggestions).slice(0, 8),
    strengths: toStrings(parsed.strengths).slice(0, 6),
    missingKeywords: toStrings(parsed.missingKeywords).slice(0, 10),
    projectIdeas: toStrings(parsed.projectIdeas).slice(0, 5),
  };
}

/* ---------------- shared JSON helper ---------------- */

async function runJson<T>(system: string, prompt: string): Promise<T> {
  const key = requireLovableApiKey();
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: `${system} Reply with minified JSON only, no markdown fences.` },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[ai] gateway failed [${response.status}]: ${body}`);
    if (response.status === 429) throw new Error("AI is rate limited right now. Try again shortly.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`AI request failed (${response.status}).`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response could not be read. Try again.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

const asStrings = (value: unknown, max: number) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, max)
    : [];

const clampScore = (value: unknown) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

/* ---------------- daily insight ---------------- */

export type DailyInsight = {
  headline: string;
  insight: string;
  taskTitle: string;
  reason: string;
};

export async function runDailyInsight(context: string): Promise<DailyInsight> {
  const result = await runJson<Partial<DailyInsight>>(
    [
      "You are the AI coach inside a placement-prep app for college students.",
      "Look at the student's skills, skill gaps, study progress, goals and placement pipeline,",
      "find the single weakest area, and prescribe one specific action for today.",
      'JSON shape: {"headline": string, "insight": string, "taskTitle": string, "reason": string}.',
      "headline: max 8 words. insight: 2 sentences naming the weak area and a concrete time-boxed action.",
      "taskTitle: a task the student can tick off today, max 70 chars, include the minutes.",
      "reason: 2 sentences explaining why this matters for their target role.",
      "Never invent data that was not provided.",
    ].join(" "),
    context,
  );

  return {
    headline: result.headline ?? "Today's focus",
    insight: result.insight ?? "",
    taskTitle: result.taskTitle ?? "",
    reason: result.reason ?? "",
  };
}

/* ---------------- 30 day roadmap ---------------- */

export type RoadmapDay = { day: number; topic: string; focus: string; hours: number };

export async function runRoadmap(input: {
  targetRole: string;
  weeklyHours: number;
  skills: string;
  gaps: string[];
}): Promise<RoadmapDay[]> {
  const result = await runJson<{ days?: unknown }>(
    [
      "You design 30-day placement preparation roadmaps for college students.",
      'JSON shape: {"days":[{"day":number,"topic":string,"focus":string,"hours":number}]}.',
      "Exactly 30 entries, day 1 to 30, ordered. topic: max 40 chars (e.g. 'Arrays & Two Pointers').",
      "focus: max 90 chars describing exactly what to practise. hours: realistic given the weekly budget.",
      "Front-load the weakest skills, interleave revision, and put mock tests on days 10, 20 and 30.",
    ].join(" "),
    [
      `Target role: ${input.targetRole}`,
      `Weekly study hours available: ${input.weeklyHours}`,
      `Skill levels: ${input.skills}`,
      `Biggest gaps: ${input.gaps.join(", ") || "none recorded"}`,
    ].join("\n"),
  );

  const days = Array.isArray(result.days) ? result.days : [];
  return days
    .map((entry, index) => {
      const row = (entry ?? {}) as Partial<RoadmapDay>;
      return {
        day: Number(row.day) || index + 1,
        topic: typeof row.topic === "string" ? row.topic.slice(0, 80) : `Day ${index + 1}`,
        focus: typeof row.focus === "string" ? row.focus.slice(0, 200) : "",
        hours: Math.max(0.5, Math.min(8, Number(row.hours) || 1)),
      };
    })
    .slice(0, 30);
}

/* ---------------- mock interview ---------------- */

export type InterviewTurn = {
  question: string;
  answer: string;
  technical: number;
  communication: number;
  confidence: number;
  completeness: number;
  feedback: string;
};

export async function runInterviewQuestion(input: {
  targetRole: string;
  asked: string[];
  skills: string;
}): Promise<{ question: string }> {
  const result = await runJson<{ question?: string }>(
    [
      "You are a technical interviewer for campus placements.",
      'JSON shape: {"question": string}.',
      "Ask exactly one interview question, max 220 chars, suited to the role and the candidate's skill levels.",
      "Mix technical, project and behavioural questions across the round. Never repeat an asked question.",
    ].join(" "),
    [
      `Role: ${input.targetRole}`,
      `Candidate skills: ${input.skills}`,
      `Already asked: ${input.asked.join(" | ") || "nothing yet"}`,
    ].join("\n"),
  );
  return { question: (result.question ?? "Tell me about yourself.").slice(0, 400) };
}

export async function runAnswerFeedback(input: {
  targetRole: string;
  question: string;
  answer: string;
}): Promise<Omit<InterviewTurn, "question" | "answer">> {
  const result = await runJson<Partial<InterviewTurn>>(
    [
      "You grade a single campus-placement interview answer.",
      'JSON shape: {"technical":number,"communication":number,"confidence":number,"completeness":number,"feedback":string}.',
      "All scores 0-100. feedback: max 45 words, one thing done well and one concrete fix.",
      "Be honest: a vague or empty answer scores low.",
    ].join(" "),
    [`Role: ${input.targetRole}`, `Question: ${input.question}`, `Answer: ${input.answer}`].join("\n"),
  );

  return {
    technical: clampScore(result.technical),
    communication: clampScore(result.communication),
    confidence: clampScore(result.confidence),
    completeness: clampScore(result.completeness),
    feedback: typeof result.feedback === "string" ? result.feedback : "",
  };
}

export type InterviewSummary = {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
};

export async function runInterviewSummary(input: {
  targetRole: string;
  transcript: string;
}): Promise<InterviewSummary> {
  const result = await runJson<Partial<InterviewSummary>>(
    [
      "You write the closing report for a mock campus-placement interview.",
      'JSON shape: {"overallScore":number,"strengths":string[],"weaknesses":string[],"recommendedTopics":string[]}.',
      "overallScore 0-100. strengths/weaknesses: 2-4 short items each. recommendedTopics: 3-6 specific study topics.",
    ].join(" "),
    [`Role: ${input.targetRole}`, `Transcript with per-answer scores:`, input.transcript].join("\n"),
  );

  return {
    overallScore: clampScore(result.overallScore),
    strengths: asStrings(result.strengths, 5),
    weaknesses: asStrings(result.weaknesses, 5),
    recommendedTopics: asStrings(result.recommendedTopics, 8),
  };
}
