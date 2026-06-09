import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход — AgentCore',
  description: 'Войдите в рабочую область AgentCore или создайте новый аккаунт для автоматизации бизнеса с AI-агентами.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
