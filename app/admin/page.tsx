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

type CancellationRequest = {
  id: string;
  signup_id: string;
  message: string | null;
  created_at: string;
  signup: AdminSignup | null;
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
  Samstag: "Samstag",
  Sonntag: "Sonntag",
};

const constructionSlots = Object.entries(slotLabels).filter(([key]) => !["Samstag", "Sonntag", "sun-18-evening"].includes(key));
const constructionRoles = ["Verpflegung", "Lead", "Helfer:in", "Kinderbetreuung", "Kinder"];
const weekendOptions = [
  ["nov-2026", "14.–15. November 2026"],
  ["dec-2026", "12.–13. Dezember 2026"],
  ["jan-2027", "09.–10. Januar 2027"],
  ["feb-2027", "06.–07. Februar 2027"],
  ["mar-2027", "06.–07. März 2027"],
] as const;

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function signupLabel(signup: AdminSignup | null) {
  if (!signup) return "Eintrag nicht mehr vorhanden";
  return signup.role === "Kinder" ? `Alter: ${signup.child_ages || "–"}` : (signup.name || "–");
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signups, setSignups] = useState<AdminSignup[]>([]);
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("alle");
  const [slot, setSlot] = useState("alle");
  const [editing, setEditing] = useState<AdminSignup | null>(null);
  const [editDraft, setEditDraft] = useState<AdminSignup | null>(null);
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error">("idle");

  async function load() {
    const signupResponse = await fetch("/api/admin/signups", { cache: "no-store" });
    if (signupResponse.status === 401) { setAuthenticated(false); return; }
    if (!signupResponse.ok) { setAuthenticated(false); setError("Die Anmeldungen konnten nicht geladen werden."); return; }
    const signupData = await signupResponse.json();
    setSignups(signupData.signups ?? []);
    setAuthenticated(true);

    const requestResponse = await fetch("/api/admin/cancellation-requests", { cache: "no-store" });
    if (requestResponse.ok) {
      const requestData = await requestResponse.json();
      setRequests(requestData.requests ?? []);
    }
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
    setAuthenticated(false); setSignups([]); setRequests([]);
  }

  async function remove(signup: AdminSignup) {
    const label = signupLabel(signup);
    if (!window.confirm(`${label} wirklich löschen?`)) return;
    const response = await fetch("/api/admin/signups", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: signup.id }) });
    if (!response.ok) { window.alert("Löschen hat nicht geklappt."); return; }
    setSignups((current) => current.filter((item) => item.id !== signup.id));
    setRequests((current) => current.filter((item) => item.signup_id !== signup.id));
  }

  function openEdit(signup: AdminSignup) {
    setEditing(signup);
    setEditDraft({ ...signup });
    setEditStatus("idle");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editDraft || editStatus === "saving") return;
    setEditStatus("saving");
    try {
      const response = await fetch("/api/admin/signups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await response.json();
      if (!response.ok || !data.signup) throw new Error();
      setSignups((current) => current.map((item) => item.id === data.signup.id ? data.signup : item));
      setRequests((current) => current.map((item) => item.signup_id === data.signup.id ? { ...item, signup: data.signup } : item));
      setEditing(null);
      setEditDraft(null);
      setEditStatus("idle");
    } catch {
      setEditStatus("error");
    }
  }

  async function handleCancellationRequest(item: CancellationRequest, action: "approve" | "reject") {
    if (action === "approve" && !window.confirm(`${signupLabel(item.signup)} wirklich löschen?`)) return;
    const response = await fetch("/api/admin/cancellation-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, action }),
    });
    if (!response.ok) { window.alert("Die Abmeldeanfrage konnte nicht verarbeitet werden."); return; }
    const data = await response.json();
    setRequests((current) => current.filter((request) => request.id !== item.id));
    if (data.signupId) setSignups((current) => current.filter((signup) => signup.id !== data.signupId));
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

    {requests.length > 0 && <section className="admin-requests"><div className="admin-section-heading"><div><p className="eyebrow">OFFENE ABMELDUNGEN</p><h2>{requests.length} {requests.length === 1 ? "Anfrage" : "Anfragen"}</h2></div></div><div className="admin-request-list">{requests.map((item) => <article className="admin-request" key={item.id}><div><strong>{signupLabel(item.signup)}</strong><p>{item.signup ? `${slotLabels[item.signup.slot] ?? item.signup.slot}${item.signup.role ? ` · ${item.signup.role}` : ""}` : "Eintrag nicht mehr vorhanden"}</p>{item.message && <p className="admin-request-message">„{item.message}“</p>}<small>{new Date(item.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</small></div><div className="admin-request-actions"><button type="button" onClick={() => handleCancellationRequest(item, "approve")}>Bestätigen & löschen</button><button className="secondary" type="button" onClick={() => handleCancellationRequest(item, "reject")}>Ablehnen</button></div></article>)}</div></section>}

    <section className="admin-toolbar"><input placeholder="Name, Kommentar, Alter …" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={role} onChange={(e) => setRole(e.target.value)}><option value="alle">Alle Rollen</option>{roles.map((r) => <option key={r}>{r}</option>)}</select><select value={slot} onChange={(e) => setSlot(e.target.value)}><option value="alle">Alle Schichten</option>{slots.map((s) => <option value={s} key={s}>{slotLabels[s] ?? s}</option>)}</select><button type="button" onClick={exportCsv}>CSV exportieren</button></section>
    <p className="admin-result-count">{filtered.length} angezeigt</p>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Schicht / Tag</th><th>Rolle</th><th>Name / Kinder</th><th>Kommentar</th><th>Erstellt</th><th></th></tr></thead><tbody>{filtered.map((s) => <tr key={s.id}><td>{slotLabels[s.slot] ?? `${s.event_id} · ${s.slot}`}</td><td>{s.role || "Wochenende"}</td><td>{signupLabel(s)}</td><td>{s.comment || "–"}</td><td>{new Date(s.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</td><td><div className="admin-row-actions"><button className="admin-edit" type="button" onClick={() => openEdit(s)}>Bearbeiten</button><button className="admin-delete" type="button" onClick={() => remove(s)}>Löschen</button></div></td></tr>)}</tbody></table></div>

    {editing && editDraft && <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}><section className="signup-modal admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="admin-edit-title" onMouseDown={(event) => event.stopPropagation()}><button className="close" type="button" aria-label="Schließen" onClick={() => setEditing(null)}>×</button><p className="eyebrow">EINTRAG BEARBEITEN</p><h2 id="admin-edit-title">{signupLabel(editing)}</h2><form onSubmit={saveEdit}>
      {editDraft.event_type === "construction-week" ? <><label>Schicht<select value={editDraft.slot} onChange={(e) => setEditDraft({ ...editDraft, slot: e.target.value })}>{constructionSlots.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Rolle<select value={editDraft.role ?? "Helfer:in"} onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value, name: e.target.value === "Kinder" ? "" : editDraft.name, child_ages: e.target.value === "Kinder" ? editDraft.child_ages : null })}>{constructionRoles.map((value) => <option value={value} key={value}>{value}</option>)}</select></label></> : <><label>Baustellen-Wochenende<select value={editDraft.event_id} onChange={(e) => setEditDraft({ ...editDraft, event_id: e.target.value })}>{weekendOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Tag<select value={editDraft.slot} onChange={(e) => setEditDraft({ ...editDraft, slot: e.target.value })}><option>Samstag</option><option>Sonntag</option></select></label></>}
      {editDraft.event_type === "construction-week" && editDraft.role === "Kinder" ? <label>Alter der Kinder<input required value={editDraft.child_ages ?? ""} onChange={(e) => setEditDraft({ ...editDraft, child_ages: e.target.value })} placeholder="z. B. 3, 6" /></label> : <><label>Name<input required value={editDraft.name ?? ""} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} /></label><label>Kommentar <span className="optional">(optional)</span><textarea rows={3} maxLength={500} value={editDraft.comment ?? ""} onChange={(e) => setEditDraft({ ...editDraft, comment: e.target.value })} /></label></>}
      {editStatus === "error" && <p className="error">Speichern hat nicht geklappt. Bitte prüfe die Angaben.</p>}<button className="submit" type="submit" disabled={editStatus === "saving"}>{editStatus === "saving" ? "Wird gespeichert …" : "Änderungen speichern"}</button>
    </form></section></div>}
  </main>;
}
