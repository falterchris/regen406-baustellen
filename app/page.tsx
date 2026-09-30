import SignupPage from "./SignupPage";

type Signup = {
  id: string;
  weekend_id: string;
  day: string;
  name: string;
  created_at: string;
  event_type: string;
  role: string;
};

export const revalidate = 30;
const SIGNUP_CACHE_SECONDS = 30;

async function getInitialSignups(): Promise<{
  signups: Signup[];
  failed: boolean;
}> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return { signups: [], failed: true };

  try {
    const response = await fetch(url, {
      next: {
        revalidate: SIGNUP_CACHE_SECONDS,
        tags: ["signups"],
      },
    });

    if (!response.ok) throw new Error("Google Sheets nicht erreichbar");

    const data = await response.json();
    return {
      signups: Array.isArray(data.signups) ? data.signups : [],
      failed: false,
    };
  } catch {
    return { signups: [], failed: true };
  }
}

export default async function Home() {
  const { signups, failed } = await getInitialSignups();
  return <SignupPage initialSignups={signups} initialLoadFailed={failed} />;
}
