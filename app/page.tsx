import SignupPage from "./SignupPage";

// Die Seite rendert sofort. Anmeldungen werden danach schnell über die
// Next.js-API aus Supabase geladen; die Seite selbst hängt nie an der Datenbank.
export default function Home() {
  return <SignupPage />;
}
