import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REGEN406 | Baustellen-Wochenenden",
  description: "Melde dich für ein Baustellen-Wochenende bei REGEN406 an.",
  icons: {
    icon: [
      { url: "/regen406-favicon-v2.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
