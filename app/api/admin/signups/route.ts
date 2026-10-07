import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { supabaseRest } from "@/lib/supabase-rest";

const select = "id,event_type,event_id,slot,role,name,comment,child_ages,created_at,legacy_import";

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const response = await supabaseRest(`signups?select=${select}&order=created_at.desc`);
    return NextResponse.json({ signups: await response.json() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Anmeldungen konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const { id } = await request.json();
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
    }
    await supabaseRest(`signups?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Eintrag konnte nicht gelöscht werden." }, { status: 500 });
  }
}
