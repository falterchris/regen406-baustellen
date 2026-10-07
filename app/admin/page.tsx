"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AdminSignup = {
  id: string;
  event_type: string;
  event_id: string;
  slot: string;
  role: string | null;
  name: string | null;
  comment: string | null;
  child_ages: string | null;
  created_at: string;
  legacy_import: boolean;
};

const slotLabels: Record<string, string> = {
  "fri-09-evening": "Fr. 09.10. · 16–20 Uhr",
  "sat-10-morning": "Sa. 10.10. · 10–15 Uhr",
  "sat-10-evening": "Sa. 10.10. · 15–20 Uhr",
  "sun-11-morning": "So. 11.10. · 10–15 Uhr",
  "sun-11-evening": "So. 11.10. · 15–19 Uhr",
  "wed-14-morning": "Mi. 14.10. · 10–15 Uhr",
  "wed-14-evening": "Mi. 14.10. · 16–20 Uhr",
  "thu-15-morning": "Do. 15.10. · 10–15 Uhr",
  "thu-15-evening": "Do. 15.10. · 16–20 Uhr",
  "fri-16-morning": "Fr. 16.10. · 10–15 Uhr",
  "fri-16-evening": "Fr. 16.10. · 16–20 Uhr",
  "sat-17-morning": "Sa. 17.10. · 10–15 Uhr",
  "sat-17-evening": "Sa. 17.10. · 15–20 Uhr",
  "sun-18-morning": "So. 18.10. · 10–15 Uhr",
  "sun-18-evening": "So. 18.10. · 15–19 Uhr (entfallen)",
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signups, setSignups] = useState<AdminSignup[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("alle");
  const [slot, setSlot] = useState("alle");

  async function load() {
    const response = await fetch("/api/admin/signups", { cache: "no-store" });
    if (response.status === 401) { setAuthenticated(false); return; }
    if (!response.ok) { setAuthenticated(false); setError("Die Anmeldungen konnten nicht geladen werden."); return; }
    const data = await response.json();
    setSignups(data.signups ?? []);
    setAuthenticated(true);
  }

  useEffect(() => { load(); }, []);

  async function login(event: FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setError("Passwort stimmt nicht."); return; }
    setPassword(""); await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false); setSignups([]);
  }

  async function remove(signup: AdminSignup) {
    const label = signup.role === "Kinder" ? `Kinder (${signup.child_ages})` : (signup.name || signup.role || "Eintrag");
    if (!window.confirm(`${label} wirklich löschen?`)) return;
    const response = await fetch("/api/admin/signups", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: signup.id }) });
    if (!response.ok) { window.alert("Löschen hat nicht geklappt."); return; }
    setSignups((current) => current.filter((item) => item.id !== signup.id));
  }

  const filtered = useMemo(() => signups.filter((signup) => {
    const haystack = `${signup.name ?? ""} ${signup.comment ?? ""} ${signup.child_ages ?? ""} ${signup.role ?? ""} ${slotLabels[signup.slot] ?? signup.slot}`.toLowerCase();
    return (role === "alle" || (signup.role || "Wochenende") === role) && (slot === "alle" || signup.slot === slot) && (!search || haystack.includes(search.toLowerCase()));
  }), [signups, role, slot, search]);

  function exportCsv() {
    const header = ["ID", "Typ", "Termin", "Schicht/Tag", "Rolle", "Name", "Kommentar", "Kinder (Alter)", "Erstellt am"];
    const lines = [header.map(csvEscape).join(";")];
    for (const s of filtered) lines.push([s.id, s.event_type, s.event_id, slotLabels[s.slot] ?? s.slot, s.role ?? "", s.name ?? "", s.comment ?? "", s.child_ages ?? "", s.created_at].map(csvEscape).join(";"));
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "regen406-anmeldungen.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (authenticated === null) return <main className="admin-shell"><p>Lade Adminbereich …</p></main>;
  if (!authenticated) return <main className="admin-shell"><section className="admin-login"><p className="eyebrow">REGEN406 ADMIN</p><h1>Anmeldungen verwalten</h1><form onSubmit={login}><label>Passwort<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required /></label>{error && <p className="error">{error}</p>}<button type="submit">Einloggen</button></form><a href="/">← zurück zur Anmeldung</a></section></main>;

  const roles = Array.from(new Set(signups.map((s) => s.role || "Wochenende"))).sort();
  const slots = Array.from(new Set(signups.map((s) => s.slot))).sort();
  const helpers = signups.filter((s) => s.role === "Helfer:in").length;
  const childcare = signups.filter((s) => s.role === "Kinderbetreuung").length;
  const children = signups.filter((s) => s.role === "Kinder").length;

  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">REGEN406 ADMIN</p><h1>Anmeldungen</h1><p>{signups.length} Einträge · {helpers} Helfer:innen · {childcare} Kinderbetreuung · {children} Kinder-Einträge</p></div><div className="admin-actions"><a href="/">Anmeldeseite ↗</a><button type="button" onClick={logout}>Abmelden</button></div></header>
    <section className="admin-toolbar"><input placeholder="Name, Kommentar, Alter …" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={role} onChange={(e) => setRole(e.target.value)}><option value="alle">Alle Rollen</option>{roles.map((r) => <option key={r}>{r}</option>)}</select><select value={slot} onChange={(e) => setSlot(e.target.value)}><option value="alle">Alle Schichten</option>{slots.map((s) => <option value={s} key={s}>{slotLabels[s] ?? s}</option>)}</select><button type="button" onClick={exportCsv}>CSV exportieren</button></section>
    <p className="admin-result-count">{filtered.length} angezeigt</p>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Schicht / Tag</th><th>Rolle</th><th>Name / Kinder</th><th>Kommentar</th><th>Erstellt</th><th></th></tr></thead><tbody>{filtered.map((s) => <tr key={s.id}><td>{slotLabels[s.slot] ?? `${s.event_id} · ${s.slot}`}</td><td>{s.role || "Wochenende"}</td><td>{s.role === "Kinder" ? `Alter: ${s.child_ages || "–"}` : (s.name || "–")}</td><td>{s.comment || "–"}</td><td>{new Date(s.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</td><td><button className="admin-delete" type="button" onClick={() => remove(s)}>Löschen</button></td></tr>)}</tbody></table></div>
  </main>;
}
