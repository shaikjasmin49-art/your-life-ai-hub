import { createFileRoute } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { analyzeResume } from "@/lib/ai.functions";
import { shortDate } from "@/lib/format";
import { useResumeAnalyses, useSaveResumeAnalysis } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Analyzer — LifeOS AI" },
      { name: "description", content: "Upload your resume PDF for an AI ATS score and rewrite suggestions." },
      { property: "og:title", content: "Resume Analyzer — LifeOS AI" },
      { property: "og:description", content: "AI ATS scoring and resume improvement suggestions." },
    ],
  }),
  component: ResumePage,
});

type Analysis = {
  atsScore: number;
  summary: string;
  missingSkills: string[];
  suggestions: string[];
};

function ResumePage() {
  const { data: history } = useResumeAnalyses();
  const save = useSaveResumeAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);

  const run = async () => {
    if (!file) return;
    setPending(true);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
      const analysis = await analyzeResume({
        data: {
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileData: btoa(binary),
          ...(targetRole.trim() ? { targetRole: targetRole.trim() } : {}),
        },
      });
      setResult(analysis);
      await save.mutateAsync({
        file_name: file.name,
        ats_score: analysis.atsScore,
        summary: analysis.summary,
        missing_skills: analysis.missingSkills,
        suggestions: analysis.suggestions,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not analyse that resume.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Resume Analyzer"
        title="Beat the bots"
        description="Upload a PDF resume and get an ATS score with concrete fixes."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <GlassCard>
          <SectionTitle title="Upload" subtitle="PDF or DOCX, up to a few pages." />
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border px-6 py-10 text-center transition-colors hover:bg-accent/40">
              <Upload className="size-6 text-primary" />
              <span className="text-sm font-medium">{file ? file.name : "Choose a resume file"}</span>
              <span className="text-xs text-muted-foreground">Nothing is shared publicly.</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="space-y-2">
              <Label htmlFor="role">Target role (optional)</Label>
              <Input
                id="role"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="Frontend engineer"
              />
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={run} disabled={!file || pending}>
              <FileText className="size-4" />
              Analyse resume
            </Button>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Result" />
          {pending ? <Shimmer>Reading your resume…</Shimmer> : null}
          {!pending && !result ? (
            <p className="text-sm text-muted-foreground">Upload a resume to see your ATS score.</p>
          ) : null}
          {!pending && result ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-end justify-between">
                  <p className="text-sm text-muted-foreground">ATS score</p>
                  <p className="text-3xl font-semibold text-gradient">{result.atsScore}</p>
                </div>
                <Progress value={result.atsScore} className="mt-2 h-2" />
              </div>
              {result.summary ? <p className="text-sm text-muted-foreground">{result.summary}</p> : null}
              {result.missingSkills.length ? (
                <div>
                  <p className="text-sm font-medium">Missing keywords</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="rounded-full">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {result.suggestions.length ? (
                <div>
                  <p className="text-sm font-medium">Suggested fixes</p>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {result.suggestions.map((item) => (
                      <li key={item} className="rounded-2xl bg-secondary/40 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </GlassCard>
      </div>

      {(history ?? []).length ? (
        <GlassCard className="mt-4">
          <SectionTitle title="Past analyses" />
          <ul className="divide-y divide-border text-sm">
            {(history ?? []).map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 truncate">{row.file_name}</span>
                <span className="text-xs text-muted-foreground">{shortDate(row.created_at)}</span>
                <span className="font-medium">{row.ats_score}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </>
  );
}
