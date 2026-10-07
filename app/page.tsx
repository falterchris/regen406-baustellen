import SignupPage from "./SignupPage";

// Die Seite selbst darf niemals auf Google Sheets / Apps Script warten.
// Anmeldungen werden nach dem Rendern im Browser über /api/signups geladen.
export default function Home() {
  return <SignupPage />;
}
