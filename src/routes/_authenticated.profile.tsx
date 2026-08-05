import { createFileRoute } from "@tanstack/react-router";
import { Award, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-session";
import { useProfile, useUpdateProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — LifeOS AI" },
      { name: "description", content: "Manage your LifeOS AI profile, skills and achievements." },
      { property: "og:title", content: "Profile — LifeOS AI" },
      { property: "og:description", content: "Your skills, achievements and profile details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useCurrentUser();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [achievementDraft, setAchievementDraft] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setSkills(profile.skills ?? []);
    setAchievements(profile.achievements ?? []);
  }, [profile]);

  const save = async () => {
    try {
      await update.mutateAsync({ full_name: fullName, bio, skills, achievements });
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title={fullName || "Your profile"}
        {...(user?.email ? { description: user.email } : {})}
        action={
          <Button variant="hero" size="lg" onClick={save} disabled={update.isPending}>
            Save changes
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <SectionTitle title="Details" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Skills" />
            <div className="flex gap-2">
              <Input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                placeholder="React"
                aria-label="New skill"
              />
              <Button
                variant="hero"
                size="icon"
                aria-label="Add skill"
                onClick={() => {
                  if (!skillDraft.trim()) return;
                  setSkills([...skills, skillDraft.trim()]);
                  setSkillDraft("");
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={`${skill}-${index}`} variant="secondary" className="gap-1 rounded-full py-1.5 pl-3">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {skills.length === 0 ? <p className="text-sm text-muted-foreground">No skills added yet.</p> : null}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Achievements" />
            <div className="flex gap-2">
              <Input
                value={achievementDraft}
                onChange={(e) => setAchievementDraft(e.target.value)}
                placeholder="Won the campus hackathon"
                aria-label="New achievement"
              />
              <Button
                variant="hero"
                size="icon"
                aria-label="Add achievement"
                onClick={() => {
                  if (!achievementDraft.trim()) return;
                  setAchievements([...achievements, achievementDraft.trim()]);
                  setAchievementDraft("");
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {achievements.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5 text-sm">
                  <Award className="size-4 text-primary" />
                  <span className="flex-1">{item}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item}`}
                    onClick={() => setAchievements(achievements.filter((_, i) => i !== index))}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
              {achievements.length === 0 ? (
                <li className="text-sm text-muted-foreground">No achievements yet.</li>
              ) : null}
            </ul>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
