export type Widget = "dropdown" | "typing";
export type Stage = "round1" | "sus1" | "round2" | "sus2" | "feedback" | "done";
export const STAGES: Stage[] = ["round1", "sus1", "round2", "sus2", "feedback", "done"];

export const normalizePid = (raw: unknown) => String(raw ?? "").trim().toUpperCase().slice(0, 32);

/** Kode ganjil mulai dari dropdown, genap dari typing (counterbalancing). */
export function firstWidget(pid: string): Widget {
  const digits = pid.replace(/\D/g, "");
  const n = digits ? parseInt(digits, 10) : [...pid].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return n % 2 === 1 ? "dropdown" : "typing";
}
export const otherWidget = (w: Widget): Widget => (w === "dropdown" ? "typing" : "dropdown");

export const isAdmin = (token: string | null) =>
  !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;

export const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
