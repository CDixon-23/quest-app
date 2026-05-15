import { Cinzel } from "next/font/google";
import type { ReactNode } from "react";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${cinzel.variable} min-h-screen bg-[#f5ede0]`}
      style={{
        backgroundImage: [
          "radial-gradient(ellipse at 20% 20%, rgba(180,140,90,0.10) 0%, transparent 55%)",
          "radial-gradient(ellipse at 80% 80%, rgba(160,120,70,0.08) 0%, transparent 55%)",
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}
