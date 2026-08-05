export function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function shortDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
