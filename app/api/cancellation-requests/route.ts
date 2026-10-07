import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signupId = String(body.signupId ?? "").trim();
    const message = String(body.message ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(signupId) || message.length > 500) {
      return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
    }

    const lookup = await supabaseRest(`signups?id=eq.${encodeURIComponent(signupId)}&select=id&limit=1`);
    const rows = await lookup.json();
    if (!Array.isArray(rows) || !rows[0]) return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });

    const existing = await supabaseRest(`cancellation_requests?signup_id=eq.${encodeURIComponent(signupId)}&select=id&limit=1`);
    const existingRows = await existing.json();
    if (Array.isArray(existingRows) && existingRows[0]) return NextResponse.json({ requested: true, alreadyExists: true });

    await supabaseRest("cancellation_requests", {
      method: "POST",
      body: JSON.stringify({ signup_id: signupId, message: message || null }),
    });
    return NextResponse.json({ requested: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Abmeldeanfrage konnte nicht gespeichert werden." }, { status: 500 });
  }
}
