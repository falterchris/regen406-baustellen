import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { supabaseRest } from "@/lib/supabase-rest";

const select = "id,event_type,event_id,slot,role,name,comment,child_ages,created_at,legacy_import";
const allowedWeekends = new Set(["nov-2026", "dec-2026", "jan-2027", "feb-2027", "mar-2027"]);
const allowedDays = new Set(["Samstag", "Sonntag"]);
const allowedConstructionSlots = new Set([
  "fri-09-evening", "sat-10-morning", "sat-10-evening", "sun-11-morning",
  "sun-11-evening", "wed-14-morning", "wed-14-evening", "thu-15-morning",
  "thu-15-evening", "fri-16-morning", "fri-16-evening", "sat-17-morning",
  "sat-17-evening", "sun-18-morning",
]);
const allowedRoles = new Set(["Verpflegung", "Lead", "Helfer:in", "Kinderbetreuung", "Kinder"]);

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

export async function PATCH(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });

    const eventType = body.event_type === "construction-week" ? "construction-week" : "weekend";
    const eventId = String(body.event_id ?? "").trim();
    const slot = String(body.slot ?? "").trim();
    const role = eventType === "construction-week" ? String(body.role ?? "").trim() : "";
    const isChildren = eventType === "construction-week" && role === "Kinder";
    const name = isChildren ? "" : String(body.name ?? "").trim();
    const comment = isChildren ? "" : String(body.comment ?? "").trim();
    const childAges = isChildren ? String(body.child_ages ?? "").trim() : "";

    const valid = eventType === "construction-week"
      ? eventId === "construction-week" && allowedConstructionSlots.has(slot) && allowedRoles.has(role)
      : allowedWeekends.has(eventId) && allowedDays.has(slot);

    if (!valid || (!isChildren && !name) || (isChildren && !childAges) || name.length > 80 || comment.length > 500 || childAges.length > 80) {
      return NextResponse.json({ error: "Bitte fülle alle Felder korrekt aus." }, { status: 400 });
    }

    const response = await supabaseRest(`signups?id=eq.${encodeURIComponent(id)}&select=${select}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify({
        event_type: eventType,
        event_id: eventId,
        slot,
        role: eventType === "construction-week" ? role : null,
        name,
        comment,
        child_ages: childAges || null,
      }),
    });
    const rows = await response.json();
    const signup = Array.isArray(rows) ? rows[0] : null;
    if (!signup) throw new Error("Kein aktualisierter Eintrag zurückgegeben.");
    return NextResponse.json({ signup });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Eintrag konnte nicht bearbeitet werden." }, { status: 500 });
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
