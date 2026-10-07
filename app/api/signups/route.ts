import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const allowedWeekends = new Set([
  "oct-2026",
  "nov-2026",
  "dec-2026",
  "jan-2027",
  "feb-2027",
  "mar-2027",
]);
const allowedDays = new Set(["Samstag", "Sonntag"]);
const allowedConstructionSlots = new Set([
  "fri-09-evening", "sat-10-morning", "sat-10-evening", "sun-11-morning",
  "sun-11-evening", "wed-14-morning", "wed-14-evening", "thu-15-morning",
  "thu-15-evening", "fri-16-morning", "fri-16-evening", "sat-17-morning",
  "sat-17-evening", "sun-18-morning",
]);
const allowedRoles = new Set(["Verpflegung", "Lead", "Helfer:in", "Kinderbetreuung", "Kinder"]);
const GOOGLE_READ_TIMEOUT_MS = 5000;

function endpoint() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) throw new Error("Google Sheets ist noch nicht eingerichtet.");
  return url;
}

async function fetchGoogleForRead() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_READ_TIMEOUT_MS);
  try {
    return await fetch(endpoint(), {
      next: { revalidate: 30, tags: ["signups"] },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    const response = await fetchGoogleForRead();
    if (!response.ok) throw new Error("Google Sheets nicht erreichbar");
    const data = await response.json();
    return NextResponse.json({ signups: data.signups ?? [] });
  } catch {
    return NextResponse.json(
      { signups: [], error: "Datenbank nicht verfügbar" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawName = String(body.name ?? "").trim();
    const rawComment = String(body.comment ?? "").trim();
    const signupId = String(body.signupId ?? "").trim();
    const validSignupId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(signupId);
    const eventType = body.eventType === "construction-week" ? "construction-week" : "weekend";
    const isChildrenSignup = eventType === "construction-week" && body.role === "Kinder";
    const name = isChildrenSignup ? "" : rawName;
    const comment = isChildrenSignup ? "" : rawComment;
    const childrenAges = isChildrenSignup ? String(body.childrenAges ?? "").trim() : "";
    const validSignup =
      eventType === "construction-week"
        ? body.weekendId === "construction-week" &&
          allowedConstructionSlots.has(body.day) &&
          allowedRoles.has(body.role)
        : allowedWeekends.has(body.weekendId) && allowedDays.has(body.day);
    if (
      !validSignup ||
      (!isChildrenSignup && !name) ||
      (isChildrenSignup && !childrenAges) ||
      name.length > 80 ||
      comment.length > 500 ||
      childrenAges.length > 80
    )
      return NextResponse.json(
        { error: "Bitte fülle alle Felder korrekt aus." },
        { status: 400 },
      );

    // Schreibvorgänge bekommen bewusst keinen kurzen Timeout: Das Frontend zeigt
    // den Eintrag bereits sofort an, während Google zuverlässig im Hintergrund speichert.
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        signupId: validSignupId ? signupId : undefined,
        weekendId: body.weekendId,
        day: body.day,
        name,
        comment,
        eventType,
        role: eventType === "construction-week" ? body.role : "",
        childrenAges,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.signup)
      throw new Error(
        data.error ?? "Google Sheets konnte die Anmeldung nicht speichern.",
      );
    revalidateTag("signups");
    return NextResponse.json({ signup: data.signup }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Eintragung konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
