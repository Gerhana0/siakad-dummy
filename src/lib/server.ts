// Helper khusus server (route handler). Jangan di-import dari komponen client.
import type { PoolClient } from "pg";
import { pool } from "./db";
import type { Stage } from "./util";

export const isAdmin = (token: string | null) =>
  !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;

/** Stage partisipan, atau null bila pid tidak terdaftar. */
export async function getStage(pid: string, db: Pick<PoolClient, "query"> = pool): Promise<Stage | null> {
  if (!pid) return null;
  const r = await db.query("SELECT stage FROM participants WHERE pid=$1", [pid]);
  return r.rows[0]?.stage ?? null;
}

/** Bungkus handler agar error tak terduga dibalas JSON 500 (bukan halaman error HTML). */
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e) {
      console.error(e);
      return Response.json({ ok: false, error: "server" }, { status: 500 });
    }
  };
}

/** Baca body JSON; body rusak dianggap objek kosong. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}

export const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });
