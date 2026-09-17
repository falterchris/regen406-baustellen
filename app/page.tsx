"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type Weekend = { id: string; month: string; days: string; dates: string; note?: string };
type Signup = { id: string; weekend_id: string; day: string; name: string; created_at: string };

const weekends: Weekend[] = [
  { id: "sep", month: "September", days: "05.–06.", dates: "05.–06. September 2026", note: "Baustellencafé & Open Air Kino am Sonntag" },
  { id: "oct", month: "Oktober", days: "17.–18.", dates: "17.–18. Oktober 2026" },
  { id: "nov", month: "November", days: "14.–15.", dates: "14.–15. November 2026" },
  { id: "dec", month: "Dezember", days: "12.–13.", dates: "12.–13. Dezember 2026" }
];

export default function Home() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [name, setName] = useState("");
  const [day, setDay] = useState("Samstag");
  const [consent, setConsent] = useState(false);
  const [activeWeekend, setActiveWeekend] = useState<string | null>(null);
  const [myIds, setMyIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    fetch("/api/signups").then((r) => r.json()).then((data) => setSignups(data.signups ?? [])).catch(() => setStatus("error"));
    const saved = window.localStorage.getItem("regen406-my-signups");
    if (saved) setMyIds(JSON.parse(saved));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeWeekend) return;
    setStatus("saving");
    try {
      const response = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekendId: activeWeekend, day, name })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSignups((current) => [...current, data.signup]);
      const updated = [...myIds, data.signup.id];
      setMyIds(updated);
      window.localStorage.setItem("regen406-my-signups", JSON.stringify(updated));
      setName(""); setConsent(false); setActiveWeekend(null); setStatus("idle");
    } catch { setStatus("error"); }
  }

  return (
    <main>
      <section className="hero">
        <nav><a href="https://www.regen406.de" aria-label="Zur REGEN406 Website"><Image src="/regen406-logo.jpg" width={77} height={96} alt="REGEN406" priority /></a><a className="back-link" href="https://www.regen406.de">← Zur Website</a></nav>
        <div className="hero-grid">
          <div className="hero-copy"><p className="eyebrow">REGEN406 · Nürnberg</p><h1>Gemeinsam<br /><em>anpacken.</em></h1><p>Unsere Baustellen-Wochenenden leben von Menschen wie dir. Such dir einen Termin aus und hilf mit, REGEN406 Schritt für Schritt zum Leben zu erwecken.</p><a className="jump" href="#termine">Termine auswählen <span>↓</span></a></div>
          <div className="hero-image"><Image src="/baustellen-we.jpg" fill sizes="(max-width: 800px) 100vw, 42vw" alt="Baustelle bei REGEN406" priority /></div>
        </div>
      </section>

      <section className="intro"><p className="big-number">10:00</p><div><h2>Kein Vorwissen. Nur Lust aufs Mitmachen.</h2><p>Kommt in Klamotten, die dreckig werden dürfen, und packt mit uns an. Ob für ein paar Stunden oder den ganzen Tag: Jede helfende Hand zählt.</p><p className="cafe">An einem der beiden Tage ist unser Baustellencafé von <strong>15–17 Uhr</strong> geöffnet – zum Kennenlernen bei Getränken und Snacks.</p></div></section>

      <section className="weekends" id="termine"><div className="section-heading"><p className="eyebrow">Baustellen-Wochenenden 2026</p><h2>Wo bist du dabei?</h2></div>
        <div className="cards">{weekends.map((weekend) => { const people = signups.filter((s) => s.weekend_id === weekend.id); return <article className="weekend-card" key={weekend.id}>
          <div className="date"><span>{weekend.days}</span><strong>{weekend.month}</strong><small>2026</small></div><div className="card-content"><p className="date-full">{weekend.dates}</p>{weekend.note && <p className="note">{weekend.note}</p>}<div className="people"><p>{people.length ? `${people.length} ${people.length === 1 ? "Person hilft" : "Menschen helfen"} mit` : "Noch niemand eingetragen"}</p><ul>{people.map((person) => <li key={person.id} className={myIds.includes(person.id) ? "is-me" : ""}>{person.name}<span>{person.day}</span></li>)}</ul></div><button type="button" onClick={() => setActiveWeekend(weekend.id)}>{myIds.some(id => people.some(person => person.id === id)) ? "Du bist dabei ✓" : "Ich helfe mit"}</button></div>
        </article>; })}</div>
      </section>

      {activeWeekend && <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveWeekend(null)}><section className="signup-modal" role="dialog" aria-modal="true" aria-labelledby="signup-title" onMouseDown={(e) => e.stopPropagation()}><button className="close" type="button" aria-label="Schließen" onClick={() => setActiveWeekend(null)}>×</button><p className="eyebrow">{weekends.find((weekend) => weekend.id === activeWeekend)?.dates}</p><h2 id="signup-title">Super, dass du dabei bist!</h2><p>Trag deinen Namen ein – wir freuen uns auf dich.</p><form onSubmit={submit}><label>Name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label><fieldset><legend>Wann kannst du helfen?</legend><div className="day-buttons">{["Samstag", "Sonntag"].map((option) => <button key={option} type="button" className={day === option ? "selected" : ""} onClick={() => setDay(option)}>{option}</button>)}</div></fieldset><label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required /> Mein Name darf in der öffentlichen Helfer:innenliste angezeigt werden.</label>{status === "error" && <p className="error">Das hat leider nicht geklappt. Bitte versuch es gleich noch einmal.</p>}<button className="submit" type="submit" disabled={status === "saving"}>{status === "saving" ? "Wird eingetragen …" : "Verbindlich eintragen"}</button></form></section></div>}
      <footer><Image src="/regen406-logo.jpg" width={40} height={50} alt="REGEN406" /><p>Regensburger Straße 406 · 90480 Nürnberg</p><a href="mailto:hallo@regen406.de">hallo@regen406.de</a></footer>
    </main>
  );
}
