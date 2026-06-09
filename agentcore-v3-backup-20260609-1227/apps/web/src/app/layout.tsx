import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import PageTransitionProvider from "@/components/PageTransitionProvider";
import { QueryProvider } from "@/lib/query-provider";
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
  description: "Платформа для создания AI-агентов для бизнеса. Цифровые сотрудники отвечают клиентам 24/7 в Telegram, WhatsApp, Instagram, собирают заявки, помогают продавать. Создайте за 2 минуты без программистов.",
  keywords: ["AI агент", "чат-бот", "автоответчик", "Telegram бот", "WhatsApp бот", "цифровой сотрудник", "автоматизация продаж", "поддержка клиентов"],
  authors: [{ name: "AgentCore" }],
  creator: "AgentCore",
  publisher: "AgentCore",
  robots: "index, follow",
  openGraph: {
    title: "AgentCore — Цифровые сотрудники для бизнеса",
    description: "Создайте AI-агента для бизнеса за 2 минуты. Отвечает клиентам 24/7, собирает заявки, помогает продавать.",
    type: "website",
    locale: "ru_RU",
    siteName: "AgentCore",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentCore — Цифровые сотрудники для бизнеса",
    description: "Создайте AI-агента для бизнеса за 2 минуты. Отвечает клиентам 24/7, собирает заявки, помогает продавать.",
  },
  alternates: {
    canonical: "https://agentcore.work",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${racama.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {process.env.NEXT_PUBLIC_YM_COUNTER_ID && (<>
          <script dangerouslySetInnerHTML={{__html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${process.env.NEXT_PUBLIC_YM_COUNTER_ID}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
          `}} />
          <noscript><div><img src={`https://mc.yandex.ru/watch/${process.env.NEXT_PUBLIC_YM_COUNTER_ID}`} style={{position:'absolute', left:'-9999px'}} alt="" /></div></noscript>
        </>)}
      </head>
      <body className="antialiased min-h-screen bg-[var(--bg)] text-[var(--text)]" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50">
          Перейти к основному содержимому
        </a>
        <QueryProvider>
          <PageTransitionProvider>
            <main id="main-content" role="main">
              {children}
            </main>
          </PageTransitionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
