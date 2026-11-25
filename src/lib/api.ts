/** POST JSON dengan percobaan ulang. Mengembalikan body JSON, atau null bila tetap gagal. */
export async function postJson<T = unknown>(url: string, body: unknown, tries = 3): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok || (r.status >= 400 && r.status < 500)) return (await r.json()) as T;
    } catch {}
    await new Promise((res) => setTimeout(res, 400 * (i + 1)));
  }
  return null;
}
