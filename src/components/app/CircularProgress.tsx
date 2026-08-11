import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function CircularProgress({
  value,
  size = 96,
  thickness = 8,
  label,
  caption,
  className,
}: {
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  caption?: string;
  className?: string;
}) {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;
  const gradientId = `ring-${size}-${thickness}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent-foreground)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold leading-none">{label ?? `${target}%`}</span>
        {caption ? (
          <span className="mt-1 max-w-[80%] text-[10px] uppercase tracking-wide text-muted-foreground">
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}
