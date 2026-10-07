import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const { signupId, cancellationToken } = await request.json();
    if (typeof signupId !== "string" || !/^[0-9a-f-]{36}$/i.test(signupId)) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const lookup = await supabaseRest(`signups?id=eq.${encodeURIComponent(signupId)}&select=id,cancellation_token&limit=1`);
    const rows = await lookup.json();
    const signup = Array.isArray(rows) ? rows[0] : null;
    if (!signup) return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });

    const tokenAllowed = typeof cancellationToken === "string" && cancellationToken && cancellationToken === signup.cancellation_token;
    if (!tokenAllowed) {
      return NextResponse.json({ error: "Abmeldung nicht autorisiert." }, { status: 403 });
    }

    await supabaseRest(`signups?id=eq.${encodeURIComponent(signupId)}`, { method: "DELETE" });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Abmeldung konnte nicht gespeichert werden." }, { status: 500 });
  }
}
