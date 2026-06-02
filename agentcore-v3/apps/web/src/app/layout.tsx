import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const racama = localFont({
  src: "../../public/fonts/Racama.otf",
  variable: "--font-racama",
  display: "swap",
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AgentCore — Цифровые сотрудники для бизнеса",
  description: "Платформа для создания цифровых сотрудников. Отвечают клиентам 24/7, собирают заявки, помогают продавать.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${racama.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen bg-[var(--bg)] text-[var(--text)]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
