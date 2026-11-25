// Helper yang aman dipakai di browser maupun server (tanpa akses DB).
export type Stage = "round1" | "sus1" | "round2" | "sus2" | "feedback" | "done";
export const STAGES: Stage[] = ["round1", "sus1", "round2", "sus2", "feedback", "done"];

export const normalizePid = (raw: unknown) => String(raw ?? "").trim().toUpperCase().slice(0, 32);

export const int = (v: unknown) =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Math.round(Number(v));

/** Ronde yang valid (1 atau 2), atau null. Menerima angka maupun string "1"/"2". */
export const parseRound = (v: unknown): 1 | 2 | null => {
  const n = Number(v);
  return n === 1 || n === 2 ? n : null;
};

/** ID unik per kejadian dari browser (untuk mencegah baris ganda saat request dicoba ulang). */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID hanya ada di konteks aman (https/localhost); sesi lewat http://<IP-laptop> memakai cadangan ini.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
