import type { Metadata } from "next";
import { Cinzel, Lora } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets:  ["latin"],
  variable: "--font-display",
  weight:   ["400", "600", "700"],
  display:  "swap",
});

const lora = Lora({
  subsets:  ["latin"],
  variable: "--font-body",
  weight:   ["400", "500", "600", "700"],
  style:    ["normal", "italic"],
  display:  "swap",
});

export const metadata: Metadata = {
  title: "Quest Forge",
  description: "Real-world micro-adventures, forged for the bold.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${lora.variable} font-body antialiased`}>
      <body>{children}</body>
    </html>
  );
}
