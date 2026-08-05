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
