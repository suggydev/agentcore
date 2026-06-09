export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
}

export interface Mode {
  id: string;
  label: string;
  fields?: ConfigField[];
}

export interface Provider {
  id: string;
  name: string;
  description?: string;
  category: 'messengers' | 'crm' | 'email' | 'automation' | 'payments';
  configFields: ConfigField[];
  modes?: Mode[];
  oauthUrl?: string;
}

export type IntegrationStatus = 'active' | 'error' | 'disconnected';

export interface AgentIntegration {
  id: string;
  providerId: string;
  agentId: string;
  status: IntegrationStatus;
  lastError?: string | null;
  config: Record<string, unknown>;
  mode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CategoryKey = 'messengers' | 'crm' | 'email' | 'automation' | 'payments';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  messengers: 'Мессенджеры',
  crm: 'CRM',
  email: 'Почта / Документы',
  automation: 'Автоматизация',
  payments: 'Платежи',
};

export const CATEGORY_ORDER: CategoryKey[] = ['messengers', 'crm', 'email', 'automation', 'payments'];

export const PROVIDER_CATEGORIES: Record<string, CategoryKey> = {
  telegram: 'messengers',
  whatsapp: 'messengers',
  vk: 'messengers',
  avito: 'messengers',
  instagram: 'messengers',
  facebook_messenger: 'messengers',
  discord: 'messengers',
  viber: 'messengers',
  smsru: 'messengers',
  yandex_messenger: 'messengers',
  amocrm: 'crm',
  bitrix24: 'crm',
  '1c': 'crm',
  yandex360: 'email',
  mailru: 'email',
  unisender: 'email',
  google_drive: 'email',
  webhooks: 'automation',
  albato: 'automation',
  yandex_cloud_functions: 'automation',
  yandex_calendar: 'automation',
  yookassa: 'payments',
  tinkoff: 'payments',
  sbp: 'payments',
  robokassa: 'payments',
  t_bank: 'payments',
};
