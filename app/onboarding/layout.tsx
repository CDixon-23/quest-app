import { Cinzel } from "next/font/google";
import type { ReactNode } from "react";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${cinzel.variable} min-h-screen bg-[#f5ede0]`}
      style={{
        backgroundImage: [
          "radial-gradient(ellipse at 15% 25%, rgba(180,140,90,0.12) 0%, transparent 55%)",
          "radial-gradient(ellipse at 85% 75%, rgba(160,120,70,0.10) 0%, transparent 55%)",
          "radial-gradient(ellipse at 50% 50%, rgba(200,160,100,0.05) 0%, transparent 70%)",
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}
