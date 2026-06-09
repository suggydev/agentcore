'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Phone,
  Globe,
  ShoppingBag,
  Camera,
  MessageCircle,
  Gamepad2,
  Radio,
  MessageSquareDashed,
  Database,
  HardDrive,
  Server,
  Mail,
  Send,
  Cloud,
  Webhook,
  Zap,
  Calendar,
  CreditCard,
  Landmark,
  Banknote,
  Receipt,
  Plug,
  Activity,
  Settings,
  Unlink,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import type { Provider, AgentIntegration } from './types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  telegram: MessageSquare,
  whatsapp: Phone,
  vk: Globe,
  avito: ShoppingBag,
  instagram: Camera,
  facebook_messenger: MessageCircle,
  discord: Gamepad2,
  viber: Radio,
  smsru: MessageSquareDashed,
  yandex_messenger: MessageSquare,
  amocrm: Database,
  bitrix24: HardDrive,
  '1c': Server,
  yandex360: Mail,
  mailru: Mail,
  unisender: Send,
  google_drive: Cloud,
  webhooks: Webhook,
  albato: Zap,
  yandex_cloud_functions: Cloud,
  yandex_calendar: Calendar,
  yookassa: CreditCard,
  tinkoff: Landmark,
  sbp: Banknote,
  robokassa: Receipt,
  t_bank: Landmark,
};

function getProviderIcon(id: string) {
  return ICON_MAP[id] || Plug;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success-soft text-success',
  error: 'bg-danger-soft text-danger',
  disconnected: 'bg-surface-2 text-text-muted',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активно',
  error: 'Ошибка',
  disconnected: 'Отключено',
};

interface IntegrationCardProps {
  provider: Provider;
  integration?: AgentIntegration;
  onConnect: (provider: Provider) => void;
  onConfigure: (integration: AgentIntegration, provider: Provider) => void;
  onDisconnect: (integrationId: string) => void;
  onHealthCheck: (integrationId: string) => void;
}

export default function IntegrationCard({
  provider,
  integration,
  onConnect,
  onConfigure,
  onDisconnect,
  onHealthCheck,
}: IntegrationCardProps) {
  const Icon = getProviderIcon(provider.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
      className="relative flex flex-col justify-between rounded-card border border-border bg-surface p-6 transition-colors dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-brand-soft text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="heading-4 text-text dark:text-white">{provider.name}</h3>
          {provider.description && (
            <p className="body-small mt-1 text-text-muted">{provider.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {integration ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold ${
                  STATUS_STYLES[integration.status] || STATUS_STYLES.disconnected
                }`}
              >
                {STATUS_LABELS[integration.status] || integration.status}
              </span>
            </div>
            {integration.status === 'error' && integration.lastError && (
              <div className="flex items-start gap-2 rounded-button bg-danger-soft p-2 text-xs text-danger">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{integration.lastError}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onConfigure(integration, provider)}
                className="btn-secondary text-sm"
                type="button"
              >
                <Settings className="h-4 w-4" />
                Настроить
              </button>
              <button
                onClick={() => onHealthCheck(integration.id)}
                className="btn-secondary text-sm"
                type="button"
              >
                <Activity className="h-4 w-4" />
                Проверка
              </button>
              <button
                onClick={() => onDisconnect(integration.id)}
                className="btn-secondary text-sm text-danger"
                type="button"
              >
                <Unlink className="h-4 w-4" />
                Отключить
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => onConnect(provider)}
            className="btn-primary w-full text-sm"
            type="button"
          >
            <Link2 className="h-4 w-4" />
            Подключить
          </button>
        )}
      </div>
    </motion.div>
  );
}
