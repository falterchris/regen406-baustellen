import { NextResponse } from "next/server";

function endpoint() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) throw new Error("Google Sheets ist noch nicht eingerichtet.");
  return url;
}

export async function POST(request: Request) {
  try {
    const { signupId } = await request.json();
    if (!signupId || typeof signupId !== "string") return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "cancellation-request", signupId })
    });
    const data = await response.json();
    if (!response.ok || !data.requested) throw new Error(data.error);
    return NextResponse.json({ requested: true });
  } catch {
    return NextResponse.json({ error: "Abmeldung konnte nicht angefragt werden." }, { status: 500 });
  }
}
