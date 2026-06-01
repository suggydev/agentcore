import { Bot, MessageSquare, FileText, Zap, Shield, BarChart3, Headphones, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlanFeature {
  conversations: string | number;
  agents: string | number;
  knowledge: string | number;
  messagesPerDay: string | number;
  channels: string | number;
  support: string;
  analytics: string;
  customModel: boolean;
  api: boolean;
  whiteLabel: boolean;
}

export const FREE_LIMITS: PlanFeature = {
  conversations: 100,
  agents: 1,
  knowledge: 10,
  messagesPerDay: 50,
  channels: 2,
  support: 'Сообщество',
  analytics: 'Базовая',
  customModel: false,
  api: false,
  whiteLabel: false,
};

export const PRO_FEATURES: PlanFeature = {
  conversations: 'Безлимитно',
  agents: 10,
  knowledge: 'Безлимитно',
  messagesPerDay: 'Безлимитно',
  channels: 'Безлимитно',
  support: 'Приоритетная почта',
  analytics: 'Расширенная',
  customModel: true,
  api: true,
  whiteLabel: false,
};

export const ENTERPRISE_FEATURES: PlanFeature = {
  conversations: 'Безлимитно',
  agents: 'Безлимитно',
  knowledge: 'Безлимитно',
  messagesPerDay: 'Безлимитно',
  channels: 'Безлимитно',
  support: 'Выделенная 24/7',
  analytics: 'Корпоративная + Кастом',
  customModel: true,
  api: true,
  whiteLabel: true,
};

export interface FeatureRow {
  label: string;
  icon: LucideIcon;
  free: string | number | boolean;
  pro: string | number | boolean;
  enterprise: string | number | boolean;
}

export function buildFeatureRows(): FeatureRow[] {
  return [
    { label: 'Диалоги', icon: MessageSquare, free: FREE_LIMITS.conversations, pro: PRO_FEATURES.conversations, enterprise: ENTERPRISE_FEATURES.conversations },
    { label: 'AI-агенты', icon: Bot, free: FREE_LIMITS.agents, pro: PRO_FEATURES.agents, enterprise: ENTERPRISE_FEATURES.agents },
    { label: 'Документы', icon: FileText, free: FREE_LIMITS.knowledge, pro: PRO_FEATURES.knowledge, enterprise: ENTERPRISE_FEATURES.knowledge },
    { label: 'Сообщений / день', icon: MessageSquare, free: FREE_LIMITS.messagesPerDay, pro: PRO_FEATURES.messagesPerDay, enterprise: ENTERPRISE_FEATURES.messagesPerDay },
    { label: 'Каналы', icon: Zap, free: FREE_LIMITS.channels, pro: PRO_FEATURES.channels, enterprise: ENTERPRISE_FEATURES.channels },
    { label: 'Поддержка', icon: Shield, free: FREE_LIMITS.support, pro: PRO_FEATURES.support, enterprise: ENTERPRISE_FEATURES.support },
    { label: 'Аналитика', icon: BarChart3, free: FREE_LIMITS.analytics, pro: PRO_FEATURES.analytics, enterprise: ENTERPRISE_FEATURES.analytics },
    { label: 'Свои модели', icon: Bot, free: FREE_LIMITS.customModel, pro: PRO_FEATURES.customModel, enterprise: ENTERPRISE_FEATURES.customModel },
    { label: 'REST API', icon: Zap, free: FREE_LIMITS.api, pro: PRO_FEATURES.api, enterprise: ENTERPRISE_FEATURES.api },
    { label: 'White Label', icon: Shield, free: FREE_LIMITS.whiteLabel, pro: PRO_FEATURES.whiteLabel, enterprise: ENTERPRISE_FEATURES.whiteLabel },
  ];
}

export interface PlanCard {
  id: 'trial' | 'starter' | 'pro' | 'enterprise';
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
  btnIcon: LucideIcon | null;
  accentColor: string;
  topBarGradient: string;
  topBarAccent: string;
  btnClass: string;
  scale: string;
}

export const PLAN_CARDS: PlanCard[] = [
  {
    id: 'trial',
    name: 'Бесплатный пробный',
    price: '$0',
    priceNumeric: 0,
    period: '/14 дн.',
    description: 'Попробуйте все функции. $10 кредитов для AI-запросов.',
    popular: false,
    features: [
      `${FREE_LIMITS.conversations} диалогов`,
      `${FREE_LIMITS.agents} агент`,
      `${FREE_LIMITS.knowledge} документов`,
      `${FREE_LIMITS.messagesPerDay} сообщений/день`,
      `${FREE_LIMITS.channels} канала`,
      'Поддержка сообщества',
      'Базовая аналитика',
    ],
    badge: null,
    btnLabel: 'Текущий план',
    btnDisabled: true,
    btnIcon: null,
    accentColor: 'border-mauve-100',
    topBarGradient: 'from-mauve-300 to-mauve-400',
    topBarAccent: 'from-mauve-300 to-mauve-400',
    btnClass: 'bg-ink-50 text-ink-400 border border-ink-100 cursor-not-allowed',
    scale: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    priceNumeric: 29,
    period: '/мес',
    description: 'Для растущего бизнеса с несколькими каналами.',
    popular: true,
    features: [
      'Безлимитно диалогов',
      '10 AI-агентов',
      'Безлимитно документов',
      'Безлимитно сообщений/день',
      'Все каналы',
      'Приоритетная почта',
      'Расширенная аналитика',
      'Свои модели',
      'Доступ к REST API',
    ],
    badge: 'Популярный',
    btnLabel: 'Обновить до Pro',
    btnDisabled: false,
    btnIcon: Sparkles,
    accentColor: 'border-mauve-600 shadow-lg shadow-mauve-600/10',
    topBarGradient: 'from-mauve-500 to-mauve-600',
    topBarAccent: 'from-mauve-500 to-mauve-600',
    btnClass: 'bg-mauve-600 text-white hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10',
    scale: 'scale-[1.02]',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    priceNumeric: 99,
    period: '/мес',
    description: 'Для организаций, которым нужны масштаб, безопасность и кастомизация.',
    popular: false,
    features: [
      'Безлимитно всё',
      'Безлимитно агентов',
      'Выделенная поддержка 24/7',
      'Корпоративная аналитика',
      'Обучение своих моделей',
      'Полный доступ к API',
      'White Label',
      'SSO и SAML',
      'Гарантия SLA',
    ],
    badge: null,
    btnLabel: 'Связаться с продажами',
    btnDisabled: false,
    btnIcon: Shield,
    accentColor: 'border-mauve-100',
    topBarGradient: 'from-ink-400 to-ink-500',
    topBarAccent: 'from-ink-400 to-ink-500',
    btnClass: 'bg-white text-ink-700 border-2 border-mauve-200 hover:bg-mauve-50 hover:border-mauve-400 transition-all duration-200',
    scale: '',
  },
];

export interface UpgradePlan {
  id: 'starter' | 'pro' | 'enterprise';
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
  btnIcon: LucideIcon | null;
  accentClass: string;
  topBarGradient: string;
  btnClass: string;
}

export const UPGRADE_PLANS: UpgradePlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    priceNumeric: 0,
    period: '/мес',
    description: 'Идеально для начала работы с AI-агентами.',
    popular: false,
    features: [
      '1 AI-агент',
      '100 диалогов/мес',
      '10 документов',
      'Веб-чат',
      'Поддержка сообщества',
      'Базовая аналитика',
    ],
    badge: null,
    btnLabel: 'Текущий план',
    btnDisabled: true,
    btnIcon: null,
    accentClass: 'border-mauve-100 bg-white',
    topBarGradient: 'from-mauve-300 to-mauve-400',
    btnClass: 'bg-white text-ink-700 border border-mauve-200 hover:bg-mauve-50',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    priceNumeric: 29,
    period: '/мес',
    description: 'Для растущего бизнеса с несколькими каналами.',
    popular: true,
    features: [
      '10 AI-агентов',
      'Безлимитно диалогов',
      'Безлимитно документов',
      'Все каналы',
      'Приоритетная почта',
      'Расширенная аналитика',
      'Свои модели',
      'Доступ к REST API',
    ],
    badge: 'Популярный',
    btnLabel: 'Обновить до Pro',
    btnDisabled: false,
    btnIcon: Sparkles,
    accentClass: 'border-mauve-600 shadow-lg shadow-mauve-600/10',
    topBarGradient: 'from-mauve-500 to-mauve-600',
    btnClass: 'bg-mauve-600 text-white hover:bg-mauve-700 shadow-sm shadow-mauve-600/10',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    priceNumeric: 99,
    period: '/мес',
    description: 'Для организаций, которым нужны масштаб и безопасность.',
    popular: false,
    features: [
      'Безлимитно агентов',
      'Безлимитно всё',
      'Выделенная поддержка 24/7',
      'Корпоративная аналитика',
      'Обучение своих моделей',
      'Полный доступ к API',
      'White Label',
      'SSO и SAML',
      'Гарантия SLA',
    ],
    badge: null,
    btnLabel: 'Связаться с продажами',
    btnDisabled: false,
    btnIcon: Shield,
    accentClass: 'border-mauve-100 bg-white',
    topBarGradient: 'from-ink-400 to-ink-500',
    btnClass: 'bg-white text-ink-700 border border-mauve-200 hover:bg-mauve-50',
  },
];

export interface ComparisonRow {
  feature: string;
  icon: LucideIcon;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

export function buildComparisonRows(): ComparisonRow[] {
  return [
    { feature: 'AI-агенты', icon: Bot, starter: '1', pro: '10', enterprise: 'Безлимитно' },
    { feature: 'Диалоги', icon: MessageSquare, starter: '100/мес', pro: 'Безлимитно', enterprise: 'Безлимитно' },
    { feature: 'Документы', icon: FileText, starter: '10', pro: 'Безлимитно', enterprise: 'Безлимитно' },
    { feature: 'Каналы', icon: Zap, starter: '1', pro: 'Все', enterprise: 'Все' },
    { feature: 'Аналитика', icon: BarChart3, starter: 'Базовая', pro: 'Расширенная', enterprise: 'Корпоративная' },
    { feature: 'Поддержка', icon: Headphones, starter: 'Сообщество', pro: 'Приоритетная почта', enterprise: 'Выделенная 24/7' },
    { feature: 'Доступ к API', icon: Zap, starter: false, pro: true, enterprise: true },
    { feature: 'Свои модели', icon: Bot, starter: false, pro: true, enterprise: true },
    { feature: 'White Label', icon: Shield, starter: false, pro: false, enterprise: true },
    { feature: 'SSO / SAML', icon: Shield, starter: false, pro: false, enterprise: true },
  ];
}

export const MONTHLY_BONUS_AMOUNT = 10;
export const TRIAL_DAYS = 14;
export const ENTERPRISE_CONTACT_EMAIL = 'enterprise@agentcore.ai';
