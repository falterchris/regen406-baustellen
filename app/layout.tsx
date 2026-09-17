import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REGEN406 | Baustellen-Wochenenden",
  description: "Melde dich für ein Baustellen-Wochenende bei REGEN406 an.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
