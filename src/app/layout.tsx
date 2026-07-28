import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PiazzaBackdrop } from "@/components/background/piazza-backdrop";
import { RoundSignalProvider } from "@/components/round-signal-provider";
import { Stage } from "@/components/stage";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Balletje-balletje",
  description: "A browser version of balletje-balletje — three cups, one ball, a shuffle, and a guess.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <RoundSignalProvider>
          <Stage>
            <PiazzaBackdrop />
            {children}
          </Stage>
        </RoundSignalProvider>
      </body>
    </html>
  );
}
