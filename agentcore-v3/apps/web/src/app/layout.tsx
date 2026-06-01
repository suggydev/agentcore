import type { Metadata } from "next";
import { Inter, Onest, Unbounded } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AgentCore — Структурированный интеллект",
  description: "Платформа интеллектуальной автоматизации процессов. Структурированная, надежная, созданная для профессионалов.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${onest.variable} ${unbounded.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen bg-[#F8F9FB] text-ink-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
