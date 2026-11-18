import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { ScheduleShell } from "@/components/schedule/ScheduleShell";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "M — Featured Projects",
  description:
    "An interactive portfolio of selected work, presented as a continuous 3D strip of featured projects.",
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      {/* Browser extensions (e.g. ColorZilla, Grammarly) add attributes to <body>,
          which would otherwise cause a hydration warning. */}
      <body suppressHydrationWarning className="bg-paper font-sans text-ink antialiased">
        <ScheduleShell>{children}</ScheduleShell>
      </body>
    </html>
  );
}
