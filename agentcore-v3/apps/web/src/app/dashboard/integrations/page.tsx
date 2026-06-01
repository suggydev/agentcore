'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Blocks,
  Zap,
  X,
} from 'lucide-react';
import InfoTooltip from '../../../components/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  comingSoon?: boolean;
  icon: string;
  color: string;
}

interface Category {
  name: string;
  icon: React.ElementType;
  items: Omit<Integration, 'id' | 'connected' | 'category'>[];
}

const categories: Category[] = [
  {
    name: 'CRM',
    icon: Blocks,
    items: [
      { name: 'HubSpot', description: 'Синхронизация контактов, сделок и тикетов', icon: 'hubspot', color: '#FF7A59', comingSoon: false },
      { name: 'Salesforce', description: 'Корпоративная CRM-интеграция', icon: 'salesforce', color: '#00A1E0', comingSoon: false },
      { name: 'Pipedrive', description: 'Управление воронкой продаж', icon: 'pipedrive', color: '#203232', comingSoon: false },
      { name: 'Zoho', description: 'Синхронизация Zoho CRM', icon: 'zoho', color: '#F0483E', comingSoon: true },
      { name: 'Bitrix24', description: 'Полная CRM и совместная работа', icon: 'bitrix', color: '#2FC6F6', comingSoon: true },
      { name: 'AmoCRM', description: 'CRM на базе мессенджеров', icon: 'amo', color: '#3550DE', comingSoon: true },
    ],
  },
  {
    name: 'Связь',
    icon: Zap,
    items: [
      { name: 'Telegram', description: 'Интеграция бота и каналов', icon: 'telegram', color: '#26A5E4', comingSoon: false },
      { name: 'WhatsApp', description: 'Business API для сообщений', icon: 'whatsapp', color: '#25D366', comingSoon: false },
      { name: 'Slack', description: 'Уведомления рабочего пространства', icon: 'slack', color: '#4A154B', comingSoon: false },
      { name: 'Discord', description: 'Интеграция серверного бота', icon: 'discord', color: '#5865F2', comingSoon: true },
      { name: 'Instagram DM', description: 'Обработка личных сообщений', icon: 'instagram', color: '#E4405F', comingSoon: true },
      { name: 'Facebook Messenger', description: 'Сообщения страницы', icon: 'messenger', color: '#0084FF', comingSoon: true },
    ],
  },
  {
    name: 'Email',
    icon: Blocks,
    items: [
      { name: 'Gmail', description: 'Синхронизация и триггеры email', icon: 'gmail', color: '#EA4335', comingSoon: false },
      { name: 'Outlook', description: 'Почта Microsoft 365', icon: 'outlook', color: '#0078D4', comingSoon: false },
      { name: 'SendGrid', description: 'API транзакционных писем', icon: 'sendgrid', color: '#1A82E2', comingSoon: true },
    ],
  },
  {
    name: 'Документы',
    icon: Blocks,
    items: [
      { name: 'Notion', description: 'Синхронизация знаний и страниц', icon: 'notion', color: '#000000', comingSoon: false },
      { name: 'Google Drive', description: 'Хранение и доступ к файлам', icon: 'gdrive', color: '#4285F4', comingSoon: false },
      { name: 'Dropbox', description: 'Интеграция облачных файлов', icon: 'dropbox', color: '#0061FF', comingSoon: true },
      { name: 'Airtable', description: 'Гибрид таблиц и базы данных', icon: 'airtable', color: '#18BFFF', comingSoon: true },
    ],
  },
  {
    name: 'Автоматизация',
    icon: Zap,
    items: [
      { name: 'Zapier', description: 'Подключение 5000+ приложений', icon: 'zapier', color: '#FF4A00', comingSoon: false },
      { name: 'Make (Integromat)', description: 'Визуальный конструктор процессов', icon: 'make', color: '#673AB7', comingSoon: false },
      { name: 'Webhooks', description: 'Пользовательские HTTP-коллбеки', icon: 'webhooks', color: '#6366F1', comingSoon: false },
      { name: 'REST API', description: 'Полный программный доступ', icon: 'restapi', color: '#10B981', comingSoon: false },
    ],
  },
  {
    name: 'Платежи',
    icon: Blocks,
    items: [
      { name: 'Stripe', description: 'Обработка платежей', icon: 'stripe', color: '#635BFF', comingSoon: false },
      { name: 'Shopify', description: 'Синхронизация магазина', icon: 'shopify', color: '#96BF48', comingSoon: true },
      { name: 'WooCommerce', description: 'E-commerce для WordPress', icon: 'woo', color: '#96588A', comingSoon: true },
    ],
  },
  {
    name: 'Календарь',
    icon: Blocks,
    items: [
      { name: 'Google Calendar', description: 'Синхронизация расписания и встреч', icon: 'gcal', color: '#4285F4', comingSoon: false },
      { name: 'Calendly', description: 'Автоматическое планирование', icon: 'calendly', color: '#006BFF', comingSoon: true },
    ],
  },
];

const iconLetters: Record<string, string> = {
  hubspot: 'H', salesforce: 'S', pipedrive: 'P', zoho: 'Z',
  bitrix: 'B', amo: 'A', telegram: 'T', whatsapp: 'W',
  slack: 'Sl', discord: 'D', instagram: 'In', messenger: 'M',
  gmail: 'G', outlook: 'O', sendgrid: 'Sg',
  notion: 'N', gdrive: 'Gd', dropbox: 'Db', airtable: 'At',
  zapier: 'Z', make: 'Mk', webhooks: 'Wh', restapi: 'API',
  stripe: 'St', shopify: 'Sh', woo: 'Wc',
  gcal: 'Gc', calendly: 'Ca',
};

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const loadIntegrations = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/integrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const connected = new Set<string>();
          const rawIntegrations = Array.isArray(data) ? data : data.integrations ?? [];
          const staticItems = categories.flatMap(c => c.items);
          rawIntegrations.forEach((i: { name?: string; id?: string; connected?: boolean }) => {
            if (i.connected) {
              const rawKey = (i.name || i.id || '').toLowerCase();
              const matched = staticItems.find(item => item.name.toLowerCase() === rawKey);
              connected.add(matched ? matched.name.toLowerCase() : rawKey);
            }
          });
          setConnectedIds(connected);
        }
      } catch (err) {
        console.error('Failed to load integrations:', err);
        setError('Не удалось загрузить интеграции');
      } finally {
        setLoading(false);
      }
    };
    loadIntegrations();
  }, []);

  const handleToggle = useCallback(async (name: string) => {
    const key = name.toLowerCase();
    const isConnected = connectedIds.has(key);

    if (isConnected) {
      setDisconnectConfirm(name);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setConnecting(name);
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${key}/connect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setConnectedIds((prev) => new Set(prev).add(key));
      } else {
        setError(`Не удалось подключить ${name}. Попробуйте позже.`);
        setTimeout(() => setError(''), 4000);
      }
    } catch {
      setError(`Ошибка сети при подключении ${name}`);
      setTimeout(() => setError(''), 4000);
    } finally {
      setConnecting(null);
    }
  }, [connectedIds]);

  const handleDisconnect = useCallback(async (name: string) => {
    const key = name.toLowerCase();
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setConnecting(name);
    setDisconnectConfirm(null);
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${key}/disconnect`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setConnectedIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        setError(`Не удалось отключить ${name}. Попробуйте позже.`);
        setTimeout(() => setError(''), 4000);
      }
    } catch {
      setError(`Ошибка сети при отключении ${name}`);
      setTimeout(() => setError(''), 4000);
    } finally {
      setConnecting(null);
    }
  }, []);

  const flattenedIntegrations = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: cat.name,
        isConnected: connectedIds.has(item.name.toLowerCase()),
      }))
    );
  }, [connectedIds]);

  const filtered = useMemo(() => {
    let list = flattenedIntegrations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      list = list.filter((i) => i.category === activeCategory);
    }
    return list;
  }, [flattenedIntegrations, search, activeCategory]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <AnimatePresence>
          {disconnectConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setDisconnectConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl border border-mauve-100 p-6 max-w-sm w-full"
              >
                <h3 className="font-semibold text-ink-900 text-lg mb-2">Отключить {disconnectConfirm}?</h3>
                <p className="text-sm text-ink-500 mb-5">
                  Вы уверены, что хотите отключить эту интеграцию? Вы сможете подключить её снова в любое время.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDisconnectConfirm(null)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-mauve-200 text-ink-600 hover:bg-mauve-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleDisconnect(disconnectConfirm)}
                    disabled={connecting !== null}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5"
                  >
                    {connecting === disconnectConfirm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Отключить
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {comingSoonModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setComingSoonModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl border border-mauve-100 p-6 max-w-sm w-full text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4 ring-1 ring-amber-200/60">
                  <Zap className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-semibold text-ink-900 text-lg mb-2">Скоро появится</h3>
                <p className="text-sm text-ink-500 mb-5">
                  Интеграция с <strong>{comingSoonModal}</strong> будет доступна в ближайшем обновлении. Мы свяжемся с вами, как только она станет доступна.
                </p>
                <button
                  onClick={() => setComingSoonModal(null)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-mauve-600 text-white hover:bg-mauve-700 transition-colors"
                >
                  Понятно
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Интеграции</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Подключите сервисы</h1>
            <p className="text-ink-500 mt-1 text-sm">Интегрируйте инструменты и сервисы</p>
          </motion.div>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              placeholder="Поиск интеграций..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-mauve-100 shadow-sm text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
            />
          </div>
          {!search && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat.name
                      ? 'bg-mauve-600 text-white shadow-sm'
                      : 'bg-white text-ink-600 border border-mauve-100 hover:border-mauve-300 hover:bg-mauve-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center mb-5 ring-1 ring-mauve-100/60">
              <Blocks className="w-7 h-7 text-mauve-400" />
            </div>
            <p className="text-ink-500 font-medium text-lg mb-1">Интеграции не найдены</p>
            <p className="text-ink-400 text-sm">Измените запрос или сбросьте фильтры</p>
          </motion.div>
        ) : (
          categories
            .filter((cat) => !activeCategory || activeCategory === cat.name)
            .map((cat) => {
              const catItems = filtered.filter((i) => i.category === cat.name);
              if (catItems.length === 0) return null;
              return (
                <motion.div
                  key={cat.name}
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="mb-10"
                >
                  <motion.h2 variants={item} className="font-display font-semibold text-lg text-ink-900 mb-5 flex items-center gap-2.5">
                    <cat.icon className="w-5 h-5 text-mauve-600" />
                    {cat.name}
                    <span className="text-xs font-normal text-ink-400">({catItems.length})</span>
                    {cat.name === 'CRM' && <InfoTooltip content="Интеграция с CRM-системами для синхронизации контактов, сделок и тикетов между AgentCore и вашей базой клиентов." iconSize={12} />}
                    {cat.name === 'Связь' && <InfoTooltip content="Подключите мессенджеры и каналы связи, чтобы агенты общались с клиентами через Telegram, WhatsApp, Slack и др." iconSize={12} />}
                    {cat.name === 'Автоматизация' && <InfoTooltip content="Инструменты автоматизации (Zapier, Make, Webhooks, REST API) — подключайте AgentCore к вашим бизнес-процессам и внешним сервисам." iconSize={12} />}
                    {cat.name === 'Платежи' && <InfoTooltip content="Приём платежей через Stripe и синхронизация с интернет-магазинами (Shopify, WooCommerce)." iconSize={12} />}
                    {cat.name === 'Email' && <InfoTooltip content="Интеграция с почтовыми сервисами (Gmail, Outlook, SendGrid) для отправки, синхронизации и отслеживания писем." iconSize={12} />}
                    {cat.name === 'Документы' && <InfoTooltip content="Синхронизация с облачными документами и базами знаний (Notion, Google Drive, Dropbox, Airtable)." iconSize={12} />}
                    {cat.name === 'Календарь' && <InfoTooltip content="Интеграция с календарями (Google Calendar, Calendly) для планирования встреч и отслеживания расписания." iconSize={12} />}
                  </motion.h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {catItems.map((integration) => {
                      const isConnected = integration.isConnected;
                      const isConnecting = connecting === integration.name;
                      return (
                        <motion.div
                          key={integration.name}
                          variants={item}
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className="relative bg-white rounded-2xl border border-mauve-100 shadow-sm hover:shadow-lg hover:shadow-mauve-200/40 hover:border-mauve-200 transition-all duration-300 p-5 group overflow-hidden"
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mauve-400/[0.02] to-transparent pointer-events-none" />
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/30 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {integration.comingSoon && (
                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200/60 text-[10px] font-semibold text-amber-700 z-10">
                              Скоро появится
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm ring-1 ring-black/[0.04] relative overflow-hidden"
                              style={{ backgroundColor: integration.color }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                              <span className="relative">{iconLetters[integration.icon] || integration.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-ink-900 text-sm truncate">{integration.name}</h3>
                                {isConnected && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Подключено
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{integration.description}</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-ink-50">
                            {integration.comingSoon ? (
                              <button
                                onClick={() => setComingSoonModal(integration.name)}
                                className="w-full py-2.5 rounded-xl text-xs font-medium border border-amber-200/60 bg-amber-50/60 text-amber-700 hover:bg-amber-100/60 transition-colors"
                              >
                                Скоро появится
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggle(integration.name)}
                                disabled={isConnecting}
                                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                  isConnected
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                    : 'bg-mauve-600 text-white hover:bg-mauve-700 shadow-sm shadow-mauve-600/10 active:scale-[0.98]'
                                }`}
                              >
                                {isConnecting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    {isConnected ? 'Отключение...' : 'Подключение...'}
                                  </>
                                ) : isConnected ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 group-hover/button:hidden" />
                                    <X className="w-3.5 h-3.5 hidden group-hover/button:block" />
                                    Подключено
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Подключить
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
        )}

        <div className="h-8" />
      </div>
    </>
  );
}
