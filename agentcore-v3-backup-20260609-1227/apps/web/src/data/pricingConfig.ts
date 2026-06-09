import type { ElementType } from 'react';
import { MessageSquare, Bot, FileText, Zap, Shield, BarChart3 } from 'lucide-react';

export interface PlanFeature {
  conversations: number;
  agents: number;
  knowledge: number;
  messagesPerDay: number;
  channels: number;
  support: string;
  analytics: string;
  customModel: string | boolean;
  api: string | boolean;
  whiteLabel: string | boolean;
}

export interface PlanCard {
  id: string;
  name: string;
  price: string;
  priceNumeric: number;
  period: string;
  description: string;
  popular: boolean;
  features: string[];
  badge: string | null;
  btnLabel: string;
  btnDisabled: boolean;
  btnIcon: ElementType | null;
  accentClass: string;
  topBarGradient: string;
  topBarAccent: string;
  btnClass: string;
  scale: string;
}

export interface FeatureComparison {
  label: string;
  icon: ElementType;
  starter: string | number | boolean;
  pro: string | number | boolean;
  enterprise: string | number | boolean;
}

// Per-agent pricing (RUB)
export const AGENT_ACTIVATION_PRICE = 4499;
export const AGENT_MONTHLY_PRICE = 2499;
export const AGENT_FREE_CREDITS = 1000;

export const FREE_LIMITS: PlanFeature = {
  conversations: 100,
  agents: 1,
  knowledge: 10,
  messagesPerDay: 50,
  channels: 1,
  support: 'Сообщество',
  analytics: 'Базовая',
  customModel: false,
  api: false,
  whiteLabel: false,
};

export const PRO_FEATURES: PlanFeature = {
  conversations: Infinity,
  agents: 10,
  knowledge: Infinity,
  messagesPerDay: Infinity,
  channels: Infinity,
  support: 'Приоритетная',
  analytics: 'Расширенная',
  customModel: true,
  api: true,
  whiteLabel: false,
};

export const ENTERPRISE_FEATURES: PlanFeature = {
  conversations: Infinity,
  agents: Infinity,
  knowledge: Infinity,
  messagesPerDay: Infinity,
  channels: Infinity,
  support: 'Выделенная 24/7',
  analytics: 'Корпоративная',
  customModel: true,
  api: true,
  whiteLabel: true,
};

export const FEATURE_COMPARISON: FeatureComparison[] = [
  { label: 'Диалоги', icon: MessageSquare, starter: FREE_LIMITS.conversations, pro: PRO_FEATURES.conversations, enterprise: ENTERPRISE_FEATURES.conversations },
  { label: 'AI-агенты', icon: Bot, starter: FREE_LIMITS.agents, pro: PRO_FEATURES.agents, enterprise: ENTERPRISE_FEATURES.agents },
  { label: 'Документы', icon: FileText, starter: FREE_LIMITS.knowledge, pro: PRO_FEATURES.knowledge, enterprise: ENTERPRISE_FEATURES.knowledge },
  { label: 'Сообщений / день', icon: MessageSquare, starter: FREE_LIMITS.messagesPerDay, pro: PRO_FEATURES.messagesPerDay, enterprise: ENTERPRISE_FEATURES.messagesPerDay },
  { label: 'Каналы', icon: Zap, starter: FREE_LIMITS.channels, pro: PRO_FEATURES.channels, enterprise: ENTERPRISE_FEATURES.channels },
  { label: 'Поддержка', icon: Shield, starter: FREE_LIMITS.support, pro: PRO_FEATURES.support, enterprise: ENTERPRISE_FEATURES.support },
  { label: 'Аналитика', icon: BarChart3, starter: FREE_LIMITS.analytics, pro: PRO_FEATURES.analytics, enterprise: ENTERPRISE_FEATURES.analytics },
  { label: 'Свои модели', icon: Bot, starter: FREE_LIMITS.customModel, pro: PRO_FEATURES.customModel, enterprise: ENTERPRISE_FEATURES.customModel },
  { label: 'REST API', icon: Zap, starter: FREE_LIMITS.api, pro: PRO_FEATURES.api, enterprise: ENTERPRISE_FEATURES.api },
  { label: 'White Label', icon: Shield, starter: FREE_LIMITS.whiteLabel, pro: PRO_FEATURES.whiteLabel, enterprise: ENTERPRISE_FEATURES.whiteLabel },
];

export const PLAN_CARDS: PlanCard[] = [
  {
    id: 'agent',
    name: 'AI-агент',
    price: '₽4 499',
    priceNumeric: 4499,
    period: ' разово',
    description: 'Создание и настройка агента + 1 месяц работы.',
    popular: true,
    features: [
      'Создание агента под ваш бизнес',
      'Настройка системного промпта',
      'Подключение интеграций',
      '1 месяц работы включён',
      '1 000 ₽ AI-кредитов/мес',
      'Редактирование без ограничений',
    ],
    badge: 'Популярный',
    btnLabel: 'Создать агента',
    btnDisabled: false,
    btnIcon: null,
  accentClass: 'border-[var(--accent)] shadow-lg ',
  topBarGradient: 'from-[var(--brand)] to-[var(--brand)]',
  topBarAccent: 'from-[var(--brand)] to-[var(--brand)]',
  btnClass: 'bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-all duration-200 shadow-sm ',
  scale: 'scale-[1.02]',
  },
  {
  id: 'maintenance',
  name: 'Поддержка агента',
  price: '₽2 499',
  priceNumeric: 2499,
  period: '/мес',
  description: 'Ежемесячная поддержка и работа агента.',
  popular: false,
  features: [
  'Безлимитная работа агента',
  '1 000 ₽ AI-кредитов/мес',
  'Обновления и улучшения',
  'Техническая поддержка',
  'Аналитика и отчёты',
  'Приоритетный доступ',
  ],
  badge: null,
  btnLabel: 'Подробнее',
  btnDisabled: false,
  btnIcon: null,
  accentClass: 'border-[var(--border)] bg-surface',
  topBarGradient: 'from-[var(--brand)]/20 to-[var(--brand)]/30',
  topBarAccent: 'from-[var(--brand)]/20 to-[var(--brand)]/30',
  btnClass: 'bg-surface text-[var(--text)] border border-[var(--border)] hover:bg-[var(--accent-soft)]',
  scale: '',
},
];

export const UPGRADE_PLANS: PlanCard[] = PLAN_CARDS;

export const ENTERPRISE_CONTACT_EMAIL = 'enterprise@agentcore.work';
export type UpgradePlan = PlanCard;

export function buildComparisonRows() {
  return FEATURE_COMPARISON.map((row) => ({
    feature: row.label,
    icon: row.icon,
    starter: row.starter,
    pro: row.pro,
    enterprise: row.enterprise,
  }));
}
