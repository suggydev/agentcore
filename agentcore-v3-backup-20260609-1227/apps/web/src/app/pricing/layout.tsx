import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Тарифы — AgentCore',
  description: 'Прозрачные цены на AI-агентов. 4 499 ₽ разово + 2 499 ₽/мес. Поддержка 24/7.',
  alternates: { canonical: 'https://agentcore.work/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
