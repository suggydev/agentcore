'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle2, Loader2, AlertCircle, ExternalLink,
  Blocks, Zap, X, MessageCircle, CreditCard, Calendar, Mail, Bot, Copy, Eye, EyeOff,
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

interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'readonly';
  placeholder?: string;
  helperText?: string;
}

const integrationFieldsConfig: Record<string, IntegrationField[]> = {
  'amoCRM': [
    { key: 'domain', label: 'Домен (поддомен)', type: 'text', placeholder: 'mycompany' },
    { key: 'clientId', label: 'Client ID (Идентификатор интеграции)', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'clientSecret', label: 'Client Secret (Секретный ключ)', type: 'password', placeholder: '••••••••••••••••••••••••' },
    { key: 'redirectUri', label: 'Redirect URI', type: 'text', placeholder: 'https://api.agentcore.work/api/integrations/amocrm/callback', helperText: 'Укажите этот же URI при создании интеграции в amoCRM' },
  ],
  'Bitrix24': [
    { key: 'domain', label: 'Домен', type: 'text', placeholder: 'portal.bitrix24.ru' },
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'client_id' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'client_secret' },
  ],
  'Telegram': [
    { key: 'token', label: 'Токен', type: 'text', placeholder: '123456:ABC-DEF1234ghikl', helperText: 'Получите токен у @BotFather в Telegram' },
  ],
  'WhatsApp': [
    { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: '1234567890' },
    { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'EAA...' },
    { key: 'verifyToken', label: 'Verify Token', type: 'text', placeholder: 'my_verify_token' },
  ],
  'Google Drive': [
    { key: 'email', label: 'Email', type: 'text', placeholder: 'user@gmail.com' },
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'google_client_id' },
  ],
  'Webhooks': [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com/webhook' },
    { key: 'secret', label: 'Секрет', type: 'text', placeholder: 'webhook_secret' },
  ],
  'REST API': [],
  'ЮKassa': [
    { key: 'shopId', label: 'Shop ID', type: 'text', placeholder: 'Например: 123456' },
    { key: 'secretKey', label: 'Секретный ключ', type: 'password', placeholder: 'test_... или live_...' },
  ],
  'Яндекс 360 / Диск': [
    { key: 'email', label: 'Email', type: 'text', placeholder: 'user@yandex.ru' },
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'yandex_client_id' },
  ],
  'Unisender': [
    { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'api_key' },
  ],
};

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
      { name: 'amoCRM', description: 'Вебхуки, управление воронкой, сделки и контакты', icon: 'amocrm', color: '#3550DE', status: 'connect', agentId: 41 },
      { name: 'Bitrix24', description: 'OAuth 2.0, задачи, лиды, полный CRM', icon: 'bitrix24', color: '#2FC6F6', status: 'connect', agentId: 42 },
      { name: '1С:Предприятие', description: 'Синхронизация контрагентов, номенклатуры и заказов', icon: '1c', color: '#C8102E', status: 'coming_soon', agentId: 40 },
    ],
  },
  {
    name: 'Связь и мессенджеры',
    icon: MessageCircle,
    items: [
      { name: 'Telegram', description: 'Боты, каналы, вебхуки — основная интеграция', icon: 'telegram', color: '#26A5E4', status: 'connect', agentId: 10 },
      { name: 'WhatsApp', description: 'Business API для корпоративных чатов', icon: 'whatsapp', color: '#25D366', status: 'connect', agentId: 11 },
      { name: 'ВКонтакте', description: 'Сообщества, Long Poll API, VK ID авторизация', icon: 'vk', color: '#0077FF', status: 'coming_soon', agentId: 43 },
      { name: 'Яндекс Мессенджер', description: 'Корпоративные чаты Яндекс 360', icon: 'yandex', color: '#FC3F1D', status: 'coming_soon', agentId: 44 },
      { name: 'Avito', description: 'Автоответы на сообщения — критично для РФ', icon: 'avito', color: '#00AAFF', status: 'coming_soon', agentId: 45 },
    ],
  },
  {
    name: 'Email и документы',
    icon: Mail,
    items: [
      { name: 'Яндекс 360 / Диск', description: 'Замена Google Workspace — почта, диск, календарь', icon: 'yandex', color: '#FC3F1D', status: 'connect', agentId: 46 },
      { name: 'Mail.ru / VK WorkSpace', description: 'Облачное хранилище и корпоративная почта', icon: 'mailru', color: '#005FF9', status: 'coming_soon', agentId: 47 },
      { name: 'Unisender', description: 'Email и SMS рассылки по РФ-аудитории', icon: 'unisender', color: '#E20045', status: 'connect', agentId: 48 },
      { name: 'Google Drive', description: 'Хранение файлов и документов', icon: 'gdrive', color: '#4285F4', status: 'connect', agentId: 20 },
    ],
  },
  {
    name: 'Автоматизация',
    icon: Zap,
    items: [
      { name: 'Albato', description: 'Главная RU-замена Zapier — 500+ коннекторов', icon: 'albato', color: '#6C5CE7', status: 'coming_soon', agentId: 49 },
      { name: 'Yandex Cloud Functions', description: 'Serverless автоматизация в RU-облаке', icon: 'yandexcloud', color: '#5282FF', status: 'coming_soon', agentId: 50 },
      { name: 'Webhooks', description: 'Пользовательские HTTP-коллбеки', icon: 'webhooks', color: '#6366F1', status: 'connect', agentId: 30 },
      { name: 'REST API', description: 'Полный программный доступ к платформе', icon: 'restapi', color: '#10B981', status: 'connect', agentId: 31 },
    ],
  },
  {
    name: 'Платежи (эквайринг РФ)',
    icon: CreditCard,
    items: [
      { name: 'ЮKassa', description: 'Главный шлюз — 54-ФЗ, чеки, возвраты', icon: 'yookassa', color: '#1F1F23', status: 'connect', agentId: 51 },
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
  [key: string]: { connected: boolean; connectedAt?: string; shopId?: string };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const [testPaymentLoading, setTestPaymentLoading] = useState(false);
  const [testPaymentResult, setTestPaymentResult] = useState<{ success: boolean; message: string } | null>(null);

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
          conn[k] = { connected: v.connected || false, connectedAt: v.connectedAt, shopId: v.shopId };
        });
        setConnected(conn);
      }
    } catch {}
    setLoading(false);
  };

  const openModal = (name: string) => {
    setFormData({});
    setRevealed({});
    setModalError('');
    setModalSuccess('');
    setCopied(false);
    setShowModal(name);
    if (name === 'REST API') {
      fetchApiKey();
    }
  };

  const closeModal = () => {
    setShowModal(null);
    setModalError('');
    setModalSuccess('');
    setTestPaymentResult(null);
    setCopied(false);
  };

  const fetchApiKey = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/restapi/key`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.key || data.apiKey || '');
      } else {
        setApiKey('sk-agentcore-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));
      }
    } catch {
      setApiKey('sk-agentcore-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleReveal = (key: string) => {
    setRevealed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleConnect = async (name: string) => {
    const fields = integrationFieldsConfig[name];
    if (fields && fields.length > 0) {
      const missing = fields.find(f => !formData[f.key]?.trim());
      if (missing) {
        setModalError(`Заполните поле "${missing.label}"`);
        return;
      }
    }

    setConnecting(name);
    setError('');
    setModalError('');
    setModalSuccess('');
    try {
      const payload: Record<string, string> = {};
      if (fields) {
        fields.forEach(f => { payload[f.key] = formData[f.key] || ''; });
      }
      if (name === 'REST API') {
        payload.apiKey = apiKey;
        payload.enabled = 'true';
      }

      const res = await fetch(`${API_BASE}/api/integrations/${name.toLowerCase()}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setConnected(prev => ({
          ...prev,
          [name.toLowerCase()]: { connected: true, connectedAt: now, shopId: payload.shopId },
        }));
        setModalSuccess('Интеграция успешно подключена');
        setTimeout(() => closeModal(), 1200);
      } else {
        const d = await res.json();
        setModalError(d.error || 'Ошибка подключения');
      }
    } catch { setModalError('Ошибка сети'); }
    setConnecting(null);
  };

  const handleYookassaTestPayment = async () => {
    setTestPaymentLoading(true);
    setTestPaymentResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/billing/yookassa/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestPaymentResult({ success: true, message: `Тестовый платёж на 1 RUB создан. ID: ${data.paymentId || data.id}` });
      } else {
        setTestPaymentResult({ success: false, message: data.error || 'Ошибка тестового платежа' });
      }
    } catch {
      setTestPaymentResult({ success: false, message: 'Ошибка сети при тестовом платеже' });
    }
    setTestPaymentLoading(false);
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
  const connectedAt = (name: string) => connected[name.toLowerCase()]?.connectedAt;

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
                  const at = connectedAt(item.name);
                  const isYooKassa = item.name === 'ЮKassa';
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
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                              isYooKassa ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" /> {isYooKassa ? 'Активен' : 'Подключено'}
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-ink-900 text-sm">{item.name}</h3>
                      <p className="text-ink-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                      {conn && at && (
                        <p className="text-[10px] text-emerald-600 mt-1.5">Подключено {formatDate(at)}</p>
                      )}
                      <div className="flex items-center gap-2 mt-4">
                        {item.status === 'coming_soon' ? (
                          <span className="text-xs text-ink-400">Ожидается</span>
                        ) : conn ? (
                          <>
                            <button onClick={() => handleDisconnect(item.name)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Отключить</button>
                            {isYooKassa && (
                              <button
                                onClick={handleYookassaTestPayment}
                                disabled={testPaymentLoading}
                                className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 ml-auto"
                              >
                                {testPaymentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Тест 1 RUB'}
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => openModal(item.name)}
                            disabled={connecting === item.name}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-mauve-50 text-mauve-600 hover:bg-mauve-100 transition-colors disabled:opacity-50"
                          >
                            {connecting === item.name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Подключить'}
                          </button>
                        )}
                        <span className="text-[9px] text-ink-300 ml-auto">Агент #{item.agentId}</span>
                      </div>

                      {isYooKassa && testPaymentResult && conn && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-3 p-2 rounded-lg text-xs ${testPaymentResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
                        >
                          {testPaymentResult.message}
                        </motion.div>
                      )}
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

      <AnimatePresence>
        {showModal && (() => {
          const fields = integrationFieldsConfig[showModal] || [];
          const item = rfCategories.flatMap(c => c.items).find(i => i.name === showModal);
          const isYooKassa = showModal === 'ЮKassa';
          const isRestApi = showModal === 'REST API';
          return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeModal}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  {item && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '18' }}>
                      <Bot className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-ink-900">{showModal}</h3>
                    <p className="text-xs text-ink-400">Подключение интеграции</p>
                  </div>
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors"><X className="w-4 h-4 text-ink-400" /></button>
                </div>

                {modalError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                {/* REST API — API key display */}
                {isRestApi && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">API Ключ</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={apiKey}
                        readOnly
                        className="flex-1 px-3 py-2.5 rounded-xl border border-mauve-200 bg-mauve-20 text-sm text-ink-900 font-mono outline-none"
                      />
                      <button
                        onClick={handleCopyApiKey}
                        className="px-3 py-2.5 rounded-xl bg-mauve-50 text-mauve-600 hover:bg-mauve-100 transition-colors flex items-center gap-1.5 text-sm font-medium whitespace-nowrap"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Скопировано' : 'Копировать'}
                      </button>
                    </div>
                    <p className="text-xs text-ink-400 mt-1.5">Сохраните ключ. Он будет показан только один раз.</p>
                  </div>
                )}

                {/* ЮKassa — helper text */}
                {isYooKassa && (
                  <p className="text-sm text-ink-500 mb-4">
                    Введите данные из{' '}
                    <a href="https://yookassa.ru/my" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">
                      личного кабинета ЮKassa <ExternalLink className="w-3 h-3" />
                    </a>
                    . Ключи находятся в разделе «Интеграции» → «Ключи API».
                  </p>
                )}

                {/* Dynamic form fields */}
                {!isRestApi && fields.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">{field.label}</label>
                        <div className="relative">
                          <input
                            type={field.type === 'password' && !revealed[field.key] ? 'password' : 'text'}
                            value={formData[field.key] || ''}
                            onChange={e => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2.5 rounded-xl border border-mauve-200 bg-white text-sm text-ink-900 placeholder:text-ink-300 outline-none focus:ring-2 focus:ring-mauve-400/30"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => toggleReveal(field.key)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-ink-400 hover:text-ink-600"
                            >
                              {revealed[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        {field.helperText && (
                          <p className="text-xs text-ink-400 mt-1">{field.helperText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isRestApi && fields.length === 0 && (
                  <p className="text-sm text-ink-500 mb-4">Данные для подключения не требуются.</p>
                )}

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-mauve-200 text-ink-600 text-sm font-medium hover:bg-mauve-50 transition-colors">Отмена</button>
                  <button
                    onClick={() => handleConnect(showModal)}
                    disabled={connecting === showModal || modalSuccess !== ''}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${
                      isYooKassa ? 'bg-blue-600 hover:bg-blue-700' : 'bg-mauve-600 hover:bg-mauve-700'
                    }`}
                  >
                    {connecting === showModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Подключить'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
