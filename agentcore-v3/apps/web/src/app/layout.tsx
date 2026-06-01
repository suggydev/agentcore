import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Onest:wght@400;500;600;700;800&family=Unbounded:wght@400;700&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased min-h-screen bg-[#F8F9FB] text-ink-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
