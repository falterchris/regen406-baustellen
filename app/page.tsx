"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type Weekend = { id: string; year: number; month: string; days: string; dates: string; cafe: string };
type Signup = { id: string; weekend_id: string; day: string; name: string; created_at: string };

const weekends: Weekend[] = [
  { id: "oct-2026", year: 2026, month: "Oktober", days: "17.–18.", dates: "17.–18. Oktober 2026", cafe: "So. 18.10. · Baustellencafé" },
  { id: "nov-2026", year: 2026, month: "November", days: "14.–15.", dates: "14.–15. November 2026", cafe: "Sa. 14.11. · Baustellencafé" },
  { id: "dec-2026", year: 2026, month: "Dezember", days: "12.–13.", dates: "12.–13. Dezember 2026", cafe: "Sa. 12.12. · Baustellencafé" },
  { id: "jan-2027", year: 2027, month: "Januar", days: "09.–10.", dates: "09.–10. Januar 2027", cafe: "Sa. 09.01. · Baustellencafé" },
  { id: "feb-2027", year: 2027, month: "Februar", days: "06.–07.", dates: "06.–07. Februar 2027", cafe: "Sa. 06.02. · Baustellencafé" },
  { id: "mar-2027", year: 2027, month: "März", days: "06.–07.", dates: "06.–07. März 2027", cafe: "Sa. 06.03. · Baustellencafé" }
];

function People({ people, myIds, cancellationIds, onCancel }: { people: Signup[]; myIds: string[]; cancellationIds: string[]; onCancel: (signup: Signup) => void }) {
  return <div className="people">
    <p>{people.length ? `${people.length} ${people.length === 1 ? "helfende Person" : "helfende Menschen"}` : "Noch niemand eingetragen"}</p>
    {(["Samstag", "Sonntag"] as const).map((day) => {
      const group = people.filter((person) => person.day === day);
      return <div className="people-day" key={day}><span>{day}</span>{group.length ? <ul>{group.map((person) => <li key={person.id} className={myIds.includes(person.id) ? "is-me" : ""}>{person.name}{myIds.includes(person.id) && (cancellationIds.includes(person.id) ? <small>Abmeldung angefragt</small> : <button type="button" onClick={() => onCancel(person)}>Abmelden</button>)}</li>)}</ul> : <em>–</em>}</div>;
    })}
  </div>;
}

export default function Home() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [name, setName] = useState("");
  const [day, setDay] = useState("Samstag");
  const [activeWeekend, setActiveWeekend] = useState<string | null>(null);
  const [myIds, setMyIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [cancellation, setCancellation] = useState<Signup | null>(null);
  const [cancellationIds, setCancellationIds] = useState<string[]>([]);
  const [cancellationStatus, setCancellationStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    fetch("/api/signups").then((response) => response.json()).then((data) => setSignups(data.signups ?? [])).catch(() => setStatus("error"));
    const saved = window.localStorage.getItem("regen406-my-signups");
    if (saved) setMyIds(JSON.parse(saved));
    const cancellationSaved = window.localStorage.getItem("regen406-cancellation-requests");
    if (cancellationSaved) setCancellationIds(JSON.parse(cancellationSaved));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWeekend) return;
    setStatus("saving");
    try {
      const response = await fetch("/api/signups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekendId: activeWeekend, day, name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSignups((current) => [...current, data.signup]);
      const updated = [...myIds, data.signup.id];
      setMyIds(updated);
      window.localStorage.setItem("regen406-my-signups", JSON.stringify(updated));
      setName(""); setActiveWeekend(null); setStatus("idle");
    } catch { setStatus("error"); }
  }

  async function requestCancellation() {
    if (!cancellation) return;
    setCancellationStatus("saving");
    try {
      const response = await fetch("/api/cancellations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signupId: cancellation.id }) });
      if (!response.ok) throw new Error();
      const updated = [...cancellationIds, cancellation.id];
      setCancellationIds(updated);
      window.localStorage.setItem("regen406-cancellation-requests", JSON.stringify(updated));
      setCancellationStatus("idle");
      setCancellation(null);
    } catch { setCancellationStatus("error"); }
  }

  function cardsFor(year: number) {
    return weekends.filter((weekend) => weekend.year === year).map((weekend) => {
      const people = signups.filter((signup) => signup.weekend_id === weekend.id);
      const isSignedUp = myIds.some((id) => people.some((person) => person.id === id));
      return <article className="weekend-card" key={weekend.id}>
        <div className="date"><span>{weekend.days}</span><strong>{weekend.month}</strong><small>{weekend.year}</small></div>
        <div className="card-content"><p className="date-full">{weekend.dates}</p><p className="cafe-note">{weekend.cafe}</p><People people={people} myIds={myIds} cancellationIds={cancellationIds} onCancel={setCancellation} /><button type="button" onClick={() => { setActiveWeekend(weekend.id); setDay("Samstag"); }}>{isSignedUp ? "Weiteren Tag eintragen" : "Ich helfe mit"}</button></div>
      </article>;
    });
  }

  return <main>
    <header className="site-header"><a href="https://www.regen406.de" aria-label="Zur REGEN406 Website"><Image src="/regen406-logo.png" width={72} height={90} alt="REGEN406" priority /></a><a className="back-link" href="https://www.regen406.de">← zur REGEN406 Website</a></header>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">MITBAUEN BEI REGEN406</p><h1>Gemeinsam<br /><em>anpacken.</em></h1><p>Ob große Baustellen-Woche oder einzelnes Wochenende: Such dir aus, wie du REGEN406 mit voranbringst.</p><a className="jump" href="#mitmachen">Möglichkeiten ansehen <span>↓</span></a></div><div className="hero-image"><Image src="/baustellen-woche.jpg" fill sizes="(max-width: 760px) 100vw, 48vw" alt="Menschen bei einer REGEN406 Baustellen-Aktion" priority /></div></section>
    <section className="format-selector" id="mitmachen"><p className="eyebrow">ZWEI MÖGLICHKEITEN MITZUMACHEN</p><div><a href="#baustellenwoche"><span>A</span><strong>Baustellen-Woche</strong><small>09.–18. Oktober · Schicht auswählen</small><b>→</b></a><a href="#termine"><span>B</span><strong>Baustellen-Wochenenden</strong><small>Einzelne Tage · direkt hier eintragen</small><b>→</b></a></div></section>
    <section className="intro"><p className="big-number">10:00</p><div><h2>Kein Vorwissen. Nur Lust aufs Mitmachen.</h2><p>Kommt in Klamotten, die dreckig werden dürfen, und packt mit uns an. Ob für ein paar Stunden oder den ganzen Tag: Jede helfende Hand zählt.</p><p className="cafe">Das Baustellencafé öffnet jeweils am angegebenen Tag von <strong>15–17 Uhr</strong> – für alle, die neugierig sind, die Baustelle anschauen und REGEN406 bei Getränken und Snacks kennenlernen wollen.</p></div></section>
    <section className="construction-week" id="baustellenwoche"><div className="construction-week-copy"><p className="eyebrow">A · 09.–18. OKTOBER 2026</p><h2>REGEN406<br />Baustellen-Woche</h2><p>Wir wollen gemeinsam die Sandarbeiten im Dachboden stemmen. Wenn jeden Tag genug von euch mitmachen, können wir die Arbeiten selbst schaffen und unserem Projekt rund 20.000 € sparen.</p><p>Ob ein paar Stunden oder mehrere Tage: Jede Unterstützung macht einen echten Unterschied. Für Essen, Getränke und einen gemeinsamen Ausklang am Lagerfeuer ist gesorgt.</p><p>Also: Freund:innen schnappen, Schicht aussuchen und mitbauen!</p><p className="cafe-note">So. 18.10. · Baustellencafé</p><a href="https://docs.google.com/spreadsheets/d/1Q573HIG5Tr0UWWzKa5tOkF3D5QVw3doLtx3TN9FP4B8/edit?gid=0#gid=0" target="_blank" rel="noreferrer">Zum Schichtplan <span>↗</span></a></div><div className="construction-week-art"><span>Schicht wählen.<br />Mitbauen.</span></div></section>
    <section className="weekends" id="termine"><div className="section-heading"><p className="eyebrow">B · BAUSTELLEN-WOCHENENDEN</p><h2>Wo bist du dabei?</h2></div><h3>2026</h3><div className="cards">{cardsFor(2026)}</div><h3 className="year-heading">2027</h3><div className="cards">{cardsFor(2027)}</div></section>
    {activeWeekend && <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveWeekend(null)}><section className="signup-modal" role="dialog" aria-modal="true" aria-labelledby="signup-title" onMouseDown={(event) => event.stopPropagation()}><button className="close" type="button" aria-label="Schließen" onClick={() => setActiveWeekend(null)}>×</button><p className="eyebrow">{weekends.find((weekend) => weekend.id === activeWeekend)?.dates}</p><h2 id="signup-title">Super, dass du dabei bist!</h2><p>Trag deinen Namen ein – wir freuen uns auf dich.</p><form onSubmit={submit}><label>Name<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label><fieldset><legend>Wann kannst du helfen?</legend><div className="day-buttons">{["Samstag", "Sonntag"].map((option) => <button key={option} type="button" className={day === option ? "selected" : ""} onClick={() => setDay(option)}>{option}</button>)}</div></fieldset>{status === "error" && <p className="error">Das hat leider nicht geklappt. Bitte versuch es gleich noch einmal.</p>}<button className="submit" type="submit" disabled={status === "saving"}>{status === "saving" ? "Wird eingetragen …" : "Verbindlich eintragen"}</button></form></section></div>}
    {cancellation && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCancellation(null)}><section className="signup-modal cancellation-modal" role="dialog" aria-modal="true" aria-labelledby="cancellation-title" onMouseDown={(event) => event.stopPropagation()}><button className="close" type="button" aria-label="Schließen" onClick={() => setCancellation(null)}>×</button><p className="eyebrow">ABMELDUNG ANFRAGEN</p><h2 id="cancellation-title">Kannst du doch nicht?</h2><p>Deine Abmeldung für <strong>{cancellation.name}</strong> am {cancellation.day} wird an das REGEN406-Team geschickt. Die Anmeldung wird nicht automatisch gelöscht.</p>{cancellationStatus === "error" && <p className="error">Das hat leider nicht geklappt. Bitte versuch es gleich noch einmal.</p>}<button className="submit" type="button" onClick={requestCancellation} disabled={cancellationStatus === "saving"}>{cancellationStatus === "saving" ? "Wird gesendet …" : "Abmeldung verbindlich anfragen"}</button></section></div>}
    <footer><Image src="/regen406-logo.png" width={40} height={50} alt="REGEN406" /><div><p>Regensburger Straße 406 · 90480 Nürnberg</p><a href="mailto:hallo@regen406.de">hallo@regen406.de</a><a href="https://www.regen406.de/impressum">Impressum</a><a href="https://www.regen406.de/datenschutz">Datenschutz</a></div></footer>
  </main>;
}
