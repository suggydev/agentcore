import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const racama = localFont({
  src: "../../public/fonts/Racama.otf",
  variable: "--font-racama",
  display: "swap",
  weight: "400",
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
    <html lang="ru" className={`${racama.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
