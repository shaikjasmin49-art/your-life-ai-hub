import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Target,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import mark from "@/assets/lifeos-mark.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/study", label: "Study Planner", icon: BookOpen },
  { to: "/goals", label: "Goal Tracker", icon: Target },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/health", label: "Health", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200",
              active
                ? "bg-brand text-primary-foreground shadow-[0_10px_30px_-14px_var(--primary)]"
                : "hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between rounded-none border-l-0 border-t-0 border-b-0 p-4 lg:flex">
        <div>
          <Brand />
          <div className="mt-6">{nav}</div>
        </div>
        <Button variant="ghost" className="justify-start gap-3 rounded-2xl" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </header>

        {open ? (
          <div className="glass animate-fade-up mx-4 mt-3 rounded-3xl p-3 lg:hidden">
            {nav}
            <Button
              variant="ghost"
              className="mt-1 w-full justify-start gap-3 rounded-2xl"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <img src={mark} alt="" className="size-9 rounded-xl" />
      <span className="text-base font-semibold tracking-tight">
        Life<span className="text-gradient">OS</span> AI
      </span>
    </Link>
  );
}
