import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const reqResponse = await supabaseRest("cancellation_requests?select=id,signup_id,message,created_at&order=created_at.asc");
    const requests = await reqResponse.json();
    const signupResponse = await supabaseRest("signups?select=id,event_type,event_id,slot,role,name,comment,child_ages,created_at");
    const signups = await signupResponse.json();
    const signupMap = new Map((Array.isArray(signups) ? signups : []).map((s: any) => [s.id, s]));
    const merged = (Array.isArray(requests) ? requests : []).map((r: any) => ({ ...r, signup: signupMap.get(r.signup_id) ?? null }));
    return NextResponse.json({ requests: merged });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Abmeldeanfragen konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const { id, action } = await request.json();
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
    }
    const lookup = await supabaseRest(`cancellation_requests?id=eq.${encodeURIComponent(id)}&select=id,signup_id&limit=1`);
    const rows = await lookup.json();
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });

    if (action === "approve") {
      await supabaseRest(`signups?id=eq.${encodeURIComponent(item.signup_id)}`, { method: "DELETE" });
      return NextResponse.json({ approved: true, signupId: item.signup_id });
    }
    await supabaseRest(`cancellation_requests?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ rejected: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Abmeldeanfrage konnte nicht verarbeitet werden." }, { status: 500 });
  }
}
