import { Cinzel } from "next/font/google";
import type { ReactNode } from "react";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${cinzel.variable} min-h-screen bg-[#f5ede0] flex items-center justify-center px-4 py-12`}
      style={{
        backgroundImage: [
          "radial-gradient(ellipse at 20% 30%, rgba(180,140,90,0.12) 0%, transparent 55%)",
          "radial-gradient(ellipse at 80% 70%, rgba(160,120,70,0.10) 0%, transparent 55%)",
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}
