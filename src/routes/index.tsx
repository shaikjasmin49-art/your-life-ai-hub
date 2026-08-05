import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, Loader2, Sparkles, Target, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import mark from "@/assets/lifeos-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifeOS AI — Sign in to your AI life OS" },
      {
        name: "description",
        content:
          "Sign in to LifeOS AI to plan your day, track study, goals, spending and health with an AI copilot.",
      },
      { property: "og:title", content: "LifeOS AI — Sign in to your AI life OS" },
      {
        property: "og:description",
        content: "Sign in to LifeOS AI to plan your day, track study, goals, spending and health with an AI copilot.",
      },
    ],
  }),
  component: LoginPage,
});

const HIGHLIGHTS = [
  { icon: Sparkles, title: "AI Assistant", copy: "Voice or text. Daily plans and career guidance." },
  { icon: Target, title: "Goals & study", copy: "Progress you can actually see." },
  { icon: Wallet, title: "Money clarity", copy: "Daily expenses with AI insights." },
  { icon: Activity, title: "Health rhythm", copy: "Water, sleep and steps, nudged." },
  { icon: BarChart3, title: "One analytics view", copy: "Every area of life, side by side." },
];

function LoginPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending("email");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAwaitingConfirm(true);
          toast.success("Check your email to confirm your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  };

  const handleGoogle = async () => {
    setPending("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try again.");
      setPending(null);
      return;
    }
    if (result.redirected) return;
    setPending(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <section className="animate-fade-up hidden lg:block">
          <div className="flex items-center gap-3">
            <img src={mark} alt="LifeOS AI logo" className="size-12 rounded-2xl animate-float" />
            <span className="text-lg font-semibold tracking-tight">
              Life<span className="text-gradient">OS</span> AI
            </span>
          </div>
          <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-tight">
            Your whole life,
            <br />
            <span className="text-gradient">run by one AI.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Tasks, study, goals, money, health and career — in a single calm workspace with an
            assistant that actually knows your day.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="glass rounded-2xl p-4">
                <item.icon className="size-4 text-primary" />
                <p className="mt-2 text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.copy}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-strong animate-fade-up rounded-3xl p-6 sm:p-8">
          <div className="lg:hidden">
            <img src={mark} alt="LifeOS AI logo" className="size-12 rounded-2xl" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold lg:mt-0">
            {mode === "signin" ? "Welcome back" : "Create your LifeOS"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to pick up where you left off."
              : "One account for every part of your life."}
          </p>

          {awaitingConfirm ? (
            <div className="glass mt-6 rounded-2xl p-4 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Open
              it to activate your account, then sign in.
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleEmail}>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={pending !== null}>
              {pending === "email" ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={handleGoogle}
            disabled={pending !== null}
          >
            {pending === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleGlyph />
            )}
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setAwaitingConfirm(false);
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1a7 7 0 0 1-6.6-4.8H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.8V6.5H1.4a12 12 0 0 0 0 11l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.5l4 3.1A7 7 0 0 1 12 4.8Z"
      />
    </svg>
  );
}
