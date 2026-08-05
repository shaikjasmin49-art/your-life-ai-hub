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
};

const RESUME_INSTRUCTIONS = [
  "You are an ATS (applicant tracking system) resume auditor.",
  "Read the attached resume and return ONLY minified JSON, no markdown fences, with this exact shape:",
  '{"atsScore": number 0-100, "summary": string, "missingSkills": string[], "suggestions": string[]}',
  "atsScore reflects parseability, keyword coverage, quantified impact and structure.",
  "summary: max 40 words. missingSkills: 3-8 concrete skills/keywords. suggestions: 4-6 rewrite actions.",
].join(" ");

export async function runResumeAnalysis(input: {
  fileName: string;
  mimeType: string;
  fileData: string;
  targetRole?: string;
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
  };
}
