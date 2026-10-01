import type { Metadata, Viewport } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";

import "./globals.css";
import { Sky } from "./sky";

const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press-start" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Habit Quest",
  description: "Level up your daily habits.",
  // Full-screen launch from the iPhone home screen (no Safari bars).
  appleWebApp: { capable: true, title: "Habit Quest", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#6ec6ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${nunito.variable}`}>
      <body>
        <Sky />
        <main className="mx-auto w-full max-w-md px-4 pt-8 pb-16">{children}</main>
      </body>
    </html>
  );
}
