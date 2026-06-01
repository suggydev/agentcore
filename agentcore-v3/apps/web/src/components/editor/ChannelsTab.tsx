'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  MessageSquare, Phone, ShoppingCart, Cloud, Mail, Zap, CreditCard,
  CheckCircle, ArrowRight, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Input } from '@/design/components/Input';
import { Modal } from '@/design/components/Modal';
import { StatusBadge } from '@/design/components/StatusBadge';
import { Skeleton } from '@/design/components/Skeleton';
import { useToast } from '@/design/components/Toast';
import { t } from '@/design/i18n';
import type { IntegrationProvider, IntegrationConnection } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ChannelsTabProps {
  agentId: string;
  token: string;
}

const PROVIDERS: IntegrationProvider[] = [
  { id: 'telegram', name: 'Telegram', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'Бот в Telegram для автоматических ответов клиентам', features: ['Автоответы 24/7', 'Команды бота', 'Уведомления'], authType: 'token', tokenHint: 'Bot Token от @BotFather' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'Phone', category: 'messengers', status: 'available', description: 'Интеграция с WhatsApp Business API', features: ['Автоответы', 'Шаблоны сообщений', 'Массовые рассылки'], authType: 'token', tokenHint: 'WhatsApp Business API Token' },
  { id: 'vk', name: 'VK', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'Сообщения сообщества ВКонтакте', features: ['Автоответы в сообщениях', 'Комментарии к постам'], authType: 'token', tokenHint: 'VK Community Token' },
  { id: 'avito', name: 'Avito', icon: 'ShoppingCart', category: 'messengers', status: 'coming_soon', description: 'Ответы на сообщения Avito', features: ['Автоответы', 'Квалификация лидов'], authType: 'none' },
  { id: 'yandex-messenger', name: 'Я.Мессенджер', icon: 'MessageSquare', category: 'messengers', status: 'coming_soon', description: 'Интеграция с Яндекс Мессенджер', features: ['Автоответы', 'Умные уведомления'], authType: 'none' },
  { id: 'amocrm', name: 'amoCRM', icon: 'Cloud', category: 'crm', status: 'available', description: 'Синхронизация сделок и контактов', features: ['Создание сделок', 'Обновление контактов', 'Автопиплайн'], authType: 'oauth', authUrl: '/api/integrations/amocrm/auth' },
  { id: 'bitrix24', name: 'Bitrix24', icon: 'Cloud', category: 'crm', status: 'available', description: 'Интеграция с Bitrix24 CRM', features: ['Лиды', 'Сделки', 'Контакты'], authType: 'oauth', authUrl: '/api/integrations/bitrix24/auth' },
  { id: '1c', name: '1С', icon: 'Cloud', category: 'crm', status: 'coming_soon', description: 'Обмен данными с 1С', features: ['Номенклатура', 'Заказы', 'Клиенты'], authType: 'none' },
  { id: 'yandex360', name: 'Я.360', icon: 'Mail', category: 'email', status: 'coming_soon', description: 'Почта Яндекс 360 для бизнеса', features: ['Входящие', 'Автоответы'], authType: 'none' },
  { id: 'mailru', name: 'Mail.ru', icon: 'Mail', category: 'email', status: 'coming_soon', description: 'Почта Mail.ru для бизнеса', features: ['Входящие', 'Рассылки'], authType: 'none' },
  { id: 'unisender', name: 'Unisender', icon: 'Mail', category: 'email', status: 'coming_soon', description: 'Email-рассылки', features: ['Рассылки', 'Шаблоны', 'Аналитика'], authType: 'none' },
  { id: 'google-drive', name: 'Google Drive', icon: 'Cloud', category: 'email', status: 'coming_soon', description: 'Документы и файлы', features: ['Чтение документов', 'Знания из файлов'], authType: 'none' },
  { id: 'albato', name: 'Albato', icon: 'Zap', category: 'automation', status: 'coming_soon', description: 'No-code автоматизация', features: ['Триггеры', 'Действия', 'Сценарии'], authType: 'none' },
  { id: 'yandex-functions', name: 'Yandex Cloud Functions', icon: 'Zap', category: 'automation', status: 'coming_soon', description: 'Serverless функции', features: ['Webhook обработка', 'Кастомная логика'], authType: 'none' },
  { id: 'webhooks', name: 'Webhooks', icon: 'Zap', category: 'automation', status: 'available', description: 'Произвольные HTTP-вебхуки', features: ['Исходящие', 'Входящие', 'Настраиваемые схемы'], authType: 'none' },
  { id: 'yookassa', name: 'ЮKassa', icon: 'CreditCard', category: 'payments', status: 'coming_soon', description: 'Приём платежей', features: ['Оплата', 'Возвраты', 'Подписки'], authType: 'none' },
  { id: 'tinkoff', name: 'Тинькофф', icon: 'CreditCard', category: 'payments', status: 'coming_soon', description: 'Тинькофф эквайринг', features: ['Оплата', 'Рассрочки'], authType: 'none' },
  { id: 'sbp', name: 'СБП', icon: 'CreditCard', category: 'payments', status: 'coming_soon', description: 'Система быстрых платежей', features: ['P2P переводы', 'QR-оплата'], authType: 'none' },
];

const CATEGORY_ORDER: IntegrationProvider['category'][] = ['messengers', 'crm', 'email', 'automation', 'payments'];

const iconMap: Record<string, typeof MessageSquare> = {
  MessageSquare, Phone, ShoppingCart, Cloud, Mail, Zap, CreditCard,
};

export default function ChannelsTab({ agentId, token }: ChannelsTabProps) {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState<IntegrationProvider | null>(null);
  const [connectStep, setConnectStep] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const { addToast } = useToast();

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : data.connections ?? []);
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setLoading(false);
  }, [agentId, token, addToast]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const getConnection = useCallback((providerId: string) => {
    return connections.find((c) => c.providerId === providerId);
  }, [connections]);

  const handleConnect = useCallback(async () => {
    if (!connectModal) return;
    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${connectModal.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId, token: tokenInput || undefined }),
      });
      if (res.ok) {
        addToast({ variant: 'success', message: t('toast.success') });
        fetchConnections();
        setConnectStep(2);
      } else {
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setConnecting(false);
  }, [connectModal, agentId, token, tokenInput, addToast, fetchConnections]);

  const handleDisconnect = useCallback(async (connectionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${connectionId}/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        addToast({ variant: 'success', message: t('toast.success') });
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [token, addToast]);

  const handleTest = useCallback(async () => {
    setTestResult('idle');
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${connectModal?.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId }),
      });
      setTestResult(res.ok ? 'success' : 'fail');
    } catch {
      setTestResult('fail');
    }
  }, [connectModal, agentId, token]);

  const closeModal = useCallback(() => {
    setConnectModal(null);
    setConnectStep(0);
    setTokenInput('');
    setTestResult('idle');
  }, []);

  if (loading) {
    return <div className="p-5"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  }

  return (
    <div className="p-5 flex flex-col gap-6">
      <h2 className="text-[20px] font-semibold text-[var(--text)]">{t('channels.title')}</h2>

      {CATEGORY_ORDER.map((cat) => {
        const providers = PROVIDERS.filter((p) => p.category === cat);
        const available = providers.filter((p) => p.status !== 'coming_soon');
        const soon = providers.filter((p) => p.status === 'coming_soon');
        if (available.length === 0 && soon.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-[14px] font-medium text-[var(--text-muted)] mb-3">
              {t(`channels.categories.${cat}`)}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {available.map((provider) => {
                const conn = getConnection(provider.id);
                const Icon = iconMap[provider.icon] || MessageSquare;
                return (
                  <Card key={provider.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-[var(--brand)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[var(--text)]">{provider.name}</p>
                      {conn ? (
                        <StatusBadge variant="active" label={t('channels.connected')} />
                      ) : (
                        <Button
                          variant="pill"
                          size="sm"
                          onClick={() => { setConnectModal(provider); setConnectStep(0); }}
                          aria-label={`${t('channels.connect')} ${provider.name}`}
                        >
                          {t('channels.connect')}
                        </Button>
                      )}
                    </div>
                    {conn && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setConnectModal(provider); setConnectStep(2); }} aria-label={t('channels.configure')}>
                          {t('channels.configure')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDisconnect(conn.id)} aria-label={t('channels.disconnect')}>
                          {t('channels.disconnect')}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
              {soon.map((provider) => {
                const Icon = iconMap[provider.icon] || MessageSquare;
                return (
                  <Card key={provider.id} className="flex items-center gap-3 opacity-50">
                    <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[var(--text-muted)]">{provider.name}</p>
                      <StatusBadge variant="draft" label={t('channels.comingSoon')} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Modal
        open={connectModal !== null}
        onClose={closeModal}
        title={`${t('channels.connectModal.title')} ${connectModal?.name ?? ''}`}
        size="md"
      >
        {connectModal && (
          <div className="flex flex-col gap-4">
            {connectStep === 0 && (
              <>
                <p className="text-[14px] text-[var(--text)]">{connectModal.description}</p>
                <ul className="flex flex-col gap-1.5">
                  {connectModal.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[14px] text-[var(--text)]">
                      <CheckCircle size={14} className="text-[var(--success)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" onClick={() => setConnectStep(1)} aria-label={t('common.next')}>
                  {t('common.next')}
                  <ArrowRight size={14} />
                </Button>
              </>
            )}
            {connectStep === 1 && (
              <>
                {connectModal.authType === 'oauth' && connectModal.authUrl && (
                  <a
                    href={`${API_BASE}${connectModal.authUrl}?agentId=${agentId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-button)] bg-[var(--brand)] text-white font-medium text-[14px] hover:opacity-90 transition-opacity"
                    aria-label="OAuth"
                  >
                    {t('channels.connectModal.stepAuth')}
                  </a>
                )}
                {connectModal.authType === 'token' && (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder={connectModal.tokenHint ?? 'Token'}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      aria-label={connectModal.tokenHint ?? 'Token'}
                    />
                    <Button variant="primary" onClick={handleConnect} loading={connecting} aria-label={t('channels.connect')}>
                      {t('channels.connect')}
                    </Button>
                  </div>
                )}
                {connectModal.authType === 'none' && (
                  <Button variant="primary" onClick={handleConnect} loading={connecting} aria-label={t('channels.connect')}>
                    {t('channels.connect')}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setConnectStep(0)} aria-label={t('common.back')}>
                  <ArrowLeft size={14} />
                  {t('common.back')}
                </Button>
              </>
            )}
            {connectStep === 2 && (
              <>
                <Button variant="secondary" onClick={handleTest} aria-label={t('channels.test')}>
                  {t('channels.connectModal.testMessage')}
                </Button>
                {testResult === 'success' && (
                  <p className="text-[14px] text-[var(--success)]">{t('channels.connectModal.testSuccess')}</p>
                )}
                {testResult === 'fail' && (
                  <p className="text-[14px] text-[var(--danger)]">{t('channels.connectModal.testFail')}</p>
                )}
                <Button variant="primary" onClick={closeModal} aria-label={t('common.close')}>
                  {t('common.close')}
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
