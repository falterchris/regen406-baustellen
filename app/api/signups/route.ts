import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

const allowedWeekends = new Set(["nov-2026", "dec-2026", "jan-2027", "feb-2027", "mar-2027"]);
const allowedDays = new Set(["Samstag", "Sonntag"]);
const NOVEMBER_FRIDAY_SLOT = "Freitag · 14–19 Uhr";
function validWeekendSlot(eventId: string, slot: string) {
  return allowedWeekends.has(eventId) && (allowedDays.has(slot) || (eventId === "nov-2026" && slot === NOVEMBER_FRIDAY_SLOT));
}
const allowedConstructionSlots = new Set([
  "fri-09-evening", "sat-10-morning", "sat-10-evening", "sun-11-morning",
  "sun-11-evening", "wed-14-morning", "wed-14-evening", "thu-15-morning",
  "thu-15-evening", "fri-16-morning", "fri-16-evening", "sat-17-morning",
  "sat-17-evening", "sun-18-morning",
]);
const allowedRoles = new Set(["Verpflegung", "Lead", "Helfer:in", "Kinderbetreuung", "Kinder"]);
const publicSelect = "id,event_id,slot,name,created_at,event_type,role,child_ages";

function firstNameOnly(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function publicShape(row: any) {
  return {
    id: row.id,
    weekend_id: row.event_id,
    day: row.slot,
    name: firstNameOnly(row.name ?? ""),
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
    const rawFirstName = String(body.firstName ?? "").trim();
    const rawLastName = String(body.lastName ?? "").trim();
    const rawComment = String(body.comment ?? "").trim();
    const requestedId = String(body.signupId ?? "").trim();
    const eventType = body.eventType === "construction-week" ? "construction-week" : "weekend";
    const isChildrenSignup = eventType === "construction-week" && body.role === "Kinder";
    const firstName = isChildrenSignup ? "" : rawFirstName;
    const lastName = isChildrenSignup ? "" : rawLastName;
    const name = isChildrenSignup ? "" : `${firstName} ${lastName}`.trim();
    const comment = isChildrenSignup ? "" : rawComment;
    const childAges = isChildrenSignup ? String(body.childrenAges ?? "").trim() : "";
    const eventId = String(body.weekendId ?? "").trim();
    const singleSlot = String(body.day ?? "").trim();
    const requestedWeekendSlots = eventType === "weekend" && Array.isArray(body.days)
      ? Array.from(new Set(body.days.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)))
      : [singleSlot];
    const slots = eventType === "weekend" ? requestedWeekendSlots : [singleSlot];
    const role = eventType === "construction-week" ? String(body.role ?? "").trim() : "";

    const validSignup = eventType === "construction-week"
      ? eventId === "construction-week" && slots.length === 1 && allowedConstructionSlots.has(slots[0]) && allowedRoles.has(role)
      : slots.length > 0 && slots.length <= 3 && slots.every((slot) => validWeekendSlot(eventId, slot));

    if (!validSignup || (!isChildrenSignup && (!firstName || !lastName)) || (isChildrenSignup && !childAges) || firstName.length > 50 || lastName.length > 80 || name.length > 140 || comment.length > 500 || childAges.length > 80) {
      return NextResponse.json({ error: "Bitte fülle alle Felder korrekt aus." }, { status: 400 });
    }

    const payloads = slots.map((slot, index) => {
      const signupId = index === 0 && slots.length === 1 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedId) ? requestedId : randomUUID();
      const cancellationToken = randomUUID();
      return {
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
    });

    const response = await supabaseRest(`signups?select=${publicSelect}`, {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(payloads),
    });
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== payloads.length) throw new Error("Supabase hat nicht alle Einträge zurückgegeben.");

    const tokens = Object.fromEntries(payloads.map((payload) => [payload.id, payload.cancellation_token]));
    const publicRows = rows.map(publicShape);
    return NextResponse.json({
      signups: publicRows,
      signup: publicRows.length === 1 ? publicRows[0] : undefined,
      cancellationTokens: tokens,
      cancellationToken: publicRows.length === 1 ? tokens[publicRows[0].id] : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Eintragung konnte nicht gespeichert werden." }, { status: 500 });
  }
}
