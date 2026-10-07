import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

const allowedWeekends = new Set(["nov-2026", "dec-2026", "jan-2027", "feb-2027", "mar-2027"]);
const allowedDays = new Set(["Samstag", "Sonntag"]);
const allowedConstructionSlots = new Set([
  "fri-09-evening", "sat-10-morning", "sat-10-evening", "sun-11-morning",
  "sun-11-evening", "wed-14-morning", "wed-14-evening", "thu-15-morning",
  "thu-15-evening", "fri-16-morning", "fri-16-evening", "sat-17-morning",
  "sat-17-evening", "sun-18-morning",
]);
const allowedRoles = new Set(["Verpflegung", "Lead", "Helfer:in", "Kinderbetreuung", "Kinder"]);
const publicSelect = "id,event_id,slot,name,created_at,event_type,role,child_ages";

function publicShape(row: any) {
  return {
    id: row.id,
    weekend_id: row.event_id,
    day: row.slot,
    name: row.name ?? "",
    created_at: row.created_at,
    event_type: row.event_type,
    role: row.role ?? "",
    children_ages: row.child_ages ?? "",
  };
}

export async function GET() {
  try {
    const response = await supabaseRest(`signups?select=${publicSelect}&order=created_at.asc`);
    const rows = await response.json();
    return NextResponse.json({ signups: Array.isArray(rows) ? rows.map(publicShape) : [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ signups: [], error: "Datenbank nicht verfügbar" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawName = String(body.name ?? "").trim();
    const rawComment = String(body.comment ?? "").trim();
    const requestedId = String(body.signupId ?? "").trim();
    const signupId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedId) ? requestedId : randomUUID();
    const eventType = body.eventType === "construction-week" ? "construction-week" : "weekend";
    const isChildrenSignup = eventType === "construction-week" && body.role === "Kinder";
    const name = isChildrenSignup ? "" : rawName;
    const comment = isChildrenSignup ? "" : rawComment;
    const childAges = isChildrenSignup ? String(body.childrenAges ?? "").trim() : "";
    const eventId = String(body.weekendId ?? "").trim();
    const slot = String(body.day ?? "").trim();
    const role = eventType === "construction-week" ? String(body.role ?? "").trim() : "";

    const validSignup = eventType === "construction-week"
      ? eventId === "construction-week" && allowedConstructionSlots.has(slot) && allowedRoles.has(role)
      : allowedWeekends.has(eventId) && allowedDays.has(slot);

    if (!validSignup || (!isChildrenSignup && !name) || (isChildrenSignup && !childAges) || name.length > 80 || comment.length > 500 || childAges.length > 80) {
      return NextResponse.json({ error: "Bitte fülle alle Felder korrekt aus." }, { status: 400 });
    }

    const cancellationToken = randomUUID();
    const payload = {
      id: signupId,
      event_type: eventType,
      event_id: eventId,
      slot,
      role: role || null,
      name,
      comment,
      child_ages: childAges || null,
      cancellation_token: cancellationToken,
      legacy_import: false,
    };

    const response = await supabaseRest(`signups?select=${publicSelect}`, {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(payload),
    });
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error("Supabase hat keinen Eintrag zurückgegeben.");

    return NextResponse.json({ signup: publicShape(row), cancellationToken }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Eintragung konnte nicht gespeichert werden." }, { status: 500 });
  }
}
