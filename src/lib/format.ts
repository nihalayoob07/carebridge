export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const age = (dob: string | null) =>
  dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 864e5)) : null;

export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export const PLAN_UNIT: Record<string, { label: string; hours?: number; days?: number }> = {
  hourly: { label: "hours", hours: 1 },
  daily: { label: "days", days: 1 },
  weekly: { label: "weeks", days: 7 },
  monthly: { label: "months", days: 30 },
};

/** Price for a booking. Weekly and monthly plans get 10% and 20% off the daily rate. */
export function price(plan: string, units: number, hourly: number, dailyRate: number) {
  if (plan === "hourly") return hourly * units;
  if (plan === "daily") return dailyRate * units;
  if (plan === "weekly") return Math.round(dailyRate * 7 * units * 0.9);
  return Math.round(dailyRate * 30 * units * 0.8);
}

export function endDate(startISO: string, plan: string, units: number) {
  const s = new Date(startISO);
  const u = PLAN_UNIT[plan]!;
  return new Date(s.getTime() + (u.hours ? u.hours * units * 36e5 : u.days! * units * 864e5)).toISOString();
}
