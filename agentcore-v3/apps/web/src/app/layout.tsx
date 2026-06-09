import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ru">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
