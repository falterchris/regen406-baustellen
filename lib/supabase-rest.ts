
type SupabaseRequestOptions = RequestInit & { prefer?: string };

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase ist noch nicht vollständig mit Vercel verbunden.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseRest(path: string, options: SupabaseRequestOptions = {}) {
  const { url, key } = config();
  const headers = new Headers(options.headers);
  headers.set("apikey", key);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.prefer) headers.set("Prefer", options.prefer);

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response;
}
