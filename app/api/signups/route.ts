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

function endpoint() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) throw new Error("Google Sheets ist noch nicht eingerichtet.");
  return url;
}

export async function GET() {
  try {
    const response = await fetch(endpoint(), { cache: "no-store" });
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
    const name = String(body.name ?? "").trim();
    const comment = String(body.comment ?? "").trim();
    if (
      !allowedWeekends.has(body.weekendId) ||
      !allowedDays.has(body.day) ||
      !name ||
      name.length > 80 ||
      comment.length > 500
    )
      return NextResponse.json(
        { error: "Bitte fülle alle Felder korrekt aus." },
        { status: 400 },
      );
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        weekendId: body.weekendId,
        day: body.day,
        name,
        comment,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.signup)
      throw new Error(
        data.error ?? "Google Sheets konnte die Anmeldung nicht speichern.",
      );
    return NextResponse.json({ signup: data.signup }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Eintragung konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
