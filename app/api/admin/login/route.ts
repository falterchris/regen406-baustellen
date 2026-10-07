import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionValue, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (typeof password !== "string" || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, adminSessionValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Login nicht möglich." }, { status: 500 });
  }
}
