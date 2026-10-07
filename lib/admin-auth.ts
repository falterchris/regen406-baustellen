import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "regen406_admin";

function adminPassword() {
  const password = process.env.REGEN406_ADMIN_PASSWORD;
  if (!password) throw new Error("REGEN406_ADMIN_PASSWORD fehlt.");
  return password;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function verifyAdminPassword(candidate: string) {
  const expected = digest(adminPassword());
  const actual = digest(candidate);
  return timingSafeEqual(expected, actual);
}

export function adminSessionValue() {
  return createHash("sha256")
    .update(`regen406-admin-session-v1:${adminPassword()}`)
    .digest("hex");
}

export async function isAdminSession() {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const expected = Buffer.from(adminSessionValue());
  const actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
