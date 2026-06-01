'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle2, Loader2, AlertCircle, ExternalLink,
  Blocks, Zap, X, MessageCircle, CreditCard, Calendar, Mail, FolderOpen, Bot,
} from 'lucide-react';
import InfoTooltip from '../../../components/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface IntegrationItem {
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'connect' | 'connected' | 'coming_soon';
  agentId: number;
  instructions?: string;
}

interface Category {
  name: string;
  icon: React.ElementType;
  items: IntegrationItem[];
}

const rfCategories: Category[] = [
  {
    name: 'CRM и ERP',
    icon: Blocks,
    items: [
      { name: 'amoCRM', description: 'Вебхуки, управление воронкой, сделки и контакты', icon: 'amocrm', color: '#3550DE', status: 'connect', agentId: 41, instructions: 'Введите домен amoCRM и API-ключ из раздела Интеграции' },
      { name: 'Bitrix24', description: 'OAuth 2.0, задачи, лиды, полный CRM', icon: 'bitrix24', color: '#2FC6F6', status: 'connect', agentId: 42, instructions: 'Введите домен портала, client_id и client_secret из REST API' },
      { name: '1С:Предприятие', description: 'Синхронизация контрагентов, номенклатуры и заказов', icon: '1c', color: '#C8102E', status: 'coming_soon', agentId: 40 },
    ],
  },
  {
    name: 'Связь и мессенджеры',
    icon: MessageCircle,
    items: [
      { name: 'Telegram', description: 'Боты, каналы, вебхуки — основная интеграция', icon: 'telegram', color: '#26A5E4', status: 'connect', agentId: 10, instructions: 'Создайте бота через @BotFather и вставьте токен' },
      { name: 'WhatsApp', description: 'Business API для корпоративных чатов', icon: 'whatsapp', color: '#25D366', status: 'connect', agentId: 11, instructions: 'Настройте WhatsApp Cloud API в Meta Business' },
      { name: 'ВКонтакте', description: 'Сообщества, Long Poll API, VK ID авторизация', icon: 'vk', color: '#0077FF', status: 'coming_soon', agentId: 43 },
      { name: 'Яндекс Мессенджер', description: 'Корпоративные чаты Яндекс 360', icon: 'yandex', color: '#FC3F1D', status: 'coming_soon', agentId: 44 },
      { name: 'Avito', description: 'Автоответы на сообщения — критично для РФ', icon: 'avito', color: '#00AAFF', status: 'coming_soon', agentId: 45 },
    ],
  },
  {
    name: 'Email и документы',
    icon: Mail,
    items: [
      { name: 'Яндекс 360 / Диск', description: 'Замена Google Workspace — почта, диск, календарь', icon: 'yandex', color: '#FC3F1D', status: 'coming_soon', agentId: 46 },
      { name: 'Mail.ru / VK WorkSpace', description: 'Облачное хранилище и корпоративная почта', icon: 'mailru', color: '#005FF9', status: 'coming_soon', agentId: 47 },
      { name: 'Unisender', description: 'Email и SMS рассылки по РФ-аудитории', icon: 'unisender', color: '#E20045', status: 'coming_soon', agentId: 48 },
      { name: 'Google Drive', description: 'Хранение файлов и документов', icon: 'gdrive', color: '#4285F4', status: 'connect', agentId: 20 },
    ],
  },
  {
    name: 'Автоматизация',
    icon: Zap,
    items: [
      { name: 'Albato', description: 'Главная RU-замена Zapier — 500+ коннекторов', icon: 'albato', color: '#6C5CE7', status: 'coming_soon', agentId: 49 },
      { name: 'Yandex Cloud Functions', description: 'Serverless автоматизация в RU-облаке', icon: 'yandexcloud', color: '#5282FF', status: 'coming_soon', agentId: 50 },
      { name: 'Webhooks', description: 'Пользовательские HTTP-коллбеки', icon: 'webhooks', color: '#6366F1', status: 'connect', agentId: 30, instructions: 'Настройте входящий webhook URL для внешних систем' },
      { name: 'REST API', description: 'Полный программный доступ к платформе', icon: 'restapi', color: '#10B981', status: 'connect', agentId: 31 },
    ],
  },
  {
    name: 'Платежи (эквайринг РФ)',
    icon: CreditCard,
    items: [
      { name: 'ЮKassa', description: 'Главный шлюз — 54-ФЗ, чеки, возвраты', icon: 'yookassa', color: '#1F1F23', status: 'connect', agentId: 51, instructions: 'Введите shopId и секретный ключ из личного кабинета ЮKassa' },
      { name: 'Robokassa', description: 'Сплитование, подписки, массовые выплаты', icon: 'robokassa', color: '#F37021', status: 'coming_soon', agentId: 52 },
      { name: 'T-Bank API', description: 'Интернет-эквайринг, автоплатежи', icon: 'tbank', color: '#FAB700', status: 'coming_soon', agentId: 53 },
    ],
  },
  {
    name: 'Календари',
    icon: Calendar,
    items: [
      { name: 'Яндекс Календарь', description: 'Синхронизация встреч и напоминаний', icon: 'yandex', color: '#FC3F1D', status: 'coming_soon', agentId: 54 },
    ],
  },
];

interface ConnectedState {
  [key: string]: { connected: boolean; connectedAt?: string };
}

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<ConnectedState>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [search, setSearch] = useState('');
  const [crmCount, setCrmCount] = useState(0);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { window.location.href = '/login'; return; }
    setToken(t);
    fetchIntegrations(t);
  }, []);

  const fetchIntegrations = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setCrmCount(data.crmContactCount || 0);
        const conn: ConnectedState = {};
        Object.entries(data.integrations || {}).forEach(([k, v]: [string, any]) => {
          conn[k] = { connected: v.connected || false, connectedAt: v.connectedAt };
        });
        setConnected(conn);
      }
    } catch {}
    setLoading(false);
  };

  const handleConnect = async (name: string) => {
    setConnecting(name);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${name.toLowerCase()}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setConnected(prev => ({ ...prev, [name.toLowerCase()]: { connected: true, connectedAt: new Date().toISOString() } }));
        setShowModal(null);
      } else {
        const d = await res.json();
        setError(d.error || 'Ошибка подключения');
      }
    } catch { setError('Ошибка сети'); }
    setConnecting(null);
  };

  const handleDisconnect = async (name: string) => {
    try {
      await fetch(`${API_BASE}/api/integrations/${name.toLowerCase()}/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnected(prev => ({ ...prev, [name.toLowerCase()]: { connected: false } }));
    } catch {}
  };

  const filteredCategories = useMemo(() => {
    if (!search) return rfCategories;
    return rfCategories.map(cat => ({
      ...cat,
      items: cat.items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())),
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  const isConnected = (name: string) => connected[name.toLowerCase()]?.connected || false;

  if (loading) return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-mauve-500 animate-spin" /></div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-ink-900">Интеграции</h1>
            <p className="text-ink-400 text-sm mt-1">Российские и СНГ-сервисы для вашего бизнеса</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск интеграций..."
              className="pl-9 pr-4 py-2 rounded-xl border border-mauve-200 bg-white text-sm text-ink-900 placeholder:text-ink-300 outline-none focus:ring-2 focus:ring-mauve-400/30 w-56"
            />
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</motion.div>
        )}

        {crmCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-emerald-800">Синхронизировано <strong>{crmCount}</strong> контактов в CRM</p>
          </div>
        )}

        <div className="space-y-8">
          {filteredCategories.map((category, idx) => (
            <motion.div key={category.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <div className="flex items-center gap-2 mb-3">
                <category.icon className="w-5 h-5 text-mauve-600" />
                <h2 className="font-semibold text-ink-900">{category.name}</h2>
                <span className="text-xs text-ink-400">{category.items.length} сервиса</span>
                <InfoTooltip content="Интеграции подключаются через API. Данные шифруются и не передаются третьим лицам." />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.items.map(item => {
                  const conn = isConnected(item.name);
                  return (
                    <motion.div
                      key={item.name}
                      whileHover={{ y: -2 }}
                      className={`relative bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                        conn ? 'border-emerald-200 bg-emerald-50/30' : 'border-mauve-100 hover:border-mauve-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '18' }}>
                          <Bot className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'coming_soon' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Скоро</span>
                          )}
                          {conn && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Подключено
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-ink-900 text-sm">{item.name}</h3>
                      <p className="text-ink-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2 mt-4">
                        {item.status === 'coming_soon' ? (
                          <span className="text-xs text-ink-400">Ожидается</span>
                        ) : conn ? (
                          <button onClick={() => handleDisconnect(item.name)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Отключить</button>
                        ) : (
                          <button
                            onClick={() => setShowModal(item.name)}
                            disabled={connecting === item.name}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-mauve-50 text-mauve-600 hover:bg-mauve-100 transition-colors disabled:opacity-50"
                          >
                            {connecting === item.name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Подключить'}
                          </button>
                        )}
                        <span className="text-[9px] text-ink-300 ml-auto">Агент #{item.agentId}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-mauve-300 mx-auto mb-4" />
            <p className="text-ink-500">Интеграции не найдены</p>
          </div>
        )}
      </motion.div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-4 w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink-900">Подключить {showModal}</h3>
                <button onClick={() => setShowModal(null)} className="p-1 rounded-lg hover:bg-ink-50"><X className="w-4 h-4 text-ink-400" /></button>
              </div>
              <p className="text-sm text-ink-500 mb-4">Интеграция будет подключена. Инструкция: введите необходимые данные API.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-mauve-200 text-ink-600 text-sm font-medium hover:bg-mauve-50">Отмена</button>
                <button onClick={() => handleConnect(showModal)} className="flex-1 px-4 py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-medium hover:bg-mauve-700">
                  {connecting === showModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Подключить'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
