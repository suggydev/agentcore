'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Building2,
  Globe,
  Bot,
  Bell,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2,
  MessageSquare,
  Phone,
  Mail,
  User,
  ChevronDown,
} from 'lucide-react';
import InfoTooltip from '../../../components/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface WorkspaceData {
  name: string;
  companySize: string;
  industry: string;
  geography: string;
  website: string;
  crm: string;
  companyName: string;
  legalName: string;
  bin: string;
  ogrn: string;
  legalAddress: string;
  physicalAddress: string;
  phone: string;
  email: string;
  workingHours: string;
  telegram: string;
  whatsapp: string;
  instagram: string;
  privacyText: string;
  termsText: string;
  refundText: string;
  deliveryText: string;
  channels: {
    webChat: boolean;
    telegram: boolean;
    whatsapp: boolean;
    slack: boolean;
    discord: boolean;
    email: boolean;
  };
  agentDefaults: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  notifications: {
    emailNotifications: boolean;
    weeklyReport: boolean;
  };
}

const defaultWorkspace: WorkspaceData = {
  name: '',
  companySize: '',
  industry: '',
  geography: '',
  website: '',
  crm: '',
  companyName: '',
  legalName: '',
  bin: '',
  ogrn: '',
  legalAddress: '',
  physicalAddress: '',
  phone: '',
  email: '',
  workingHours: '',
  telegram: '',
  whatsapp: '',
  instagram: '',
  privacyText: '',
  termsText: '',
  refundText: '',
  deliveryText: '',
  channels: {
    webChat: true,
    telegram: false,
    whatsapp: false,
    slack: false,
    discord: false,
    email: false,
  },
  agentDefaults: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
  },
  notifications: {
    emailNotifications: true,
    weeklyReport: true,
  },
};

const companySizes = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'];
const industries = ['Технологии', 'Медицина', 'Финансы', 'E-commerce', 'Образование', 'Недвижимость', 'Маркетинг', 'Юриспруденция', 'Другое'];
const geographies = ['Сев. Америка', 'Европа', 'Азия', 'Лат. Америка', 'Бл. Восток', 'Африка', 'Весь мир'];
const crms = ['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Bitrix24', 'AmoCRM', 'Нет'];
const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet', 'gemini-2.0-flash'];

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  saved: boolean;
  onSave: () => void;
}

function SectionHeader({ icon: Icon, title, description, saved, onSave }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-ink-100">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60 flex-shrink-0 mt-0.5">
          <Icon className="w-[18px] h-[18px] text-mauve-600" />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saved}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
          saved
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
            : 'bg-mauve-600 text-white hover:bg-mauve-700 shadow-sm shadow-mauve-600/10'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Сохранено
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Сохранить
          </>
        )}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(defaultWorkspace);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          if (user.workspace) {
            const settings = user.workspace.settings || {};
            setWorkspace((prev) => ({
              ...prev,
              ...user.workspace,
              channels: { ...prev.channels, ...user.workspace?.channels },
              agentDefaults: { ...prev.agentDefaults, ...user.workspace?.agentDefaults },
              notifications: { ...prev.notifications, ...user.workspace?.notifications },
              companyName: settings.companyName || prev.companyName || '',
              legalName: settings.legalName || prev.legalName || '',
              bin: settings.bin || prev.bin || '',
              ogrn: settings.ogrn || prev.ogrn || '',
              legalAddress: settings.legalAddress || prev.legalAddress || '',
              physicalAddress: settings.physicalAddress || prev.physicalAddress || '',
              phone: settings.phone || prev.phone || '',
              email: settings.email || prev.email || '',
              workingHours: settings.workingHours || prev.workingHours || '',
              telegram: settings.telegram || prev.telegram || '',
              whatsapp: settings.whatsapp || prev.whatsapp || '',
              instagram: settings.instagram || prev.instagram || '',
              privacyText: settings.privacyText || prev.privacyText || '',
              termsText: settings.termsText || prev.termsText || '',
              refundText: settings.refundText || prev.refundText || '',
              deliveryText: settings.deliveryText || prev.deliveryText || '',
            }));
          } else if (user.workspaceName) {
            setWorkspace((prev) => ({ ...prev, name: user.workspaceName }));
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateWorkspace = useCallback(<K extends keyof WorkspaceData>(key: K, value: WorkspaceData[K]) => {
    setWorkspace((prev) => ({ ...prev, [key]: value }));
    setSavedSections((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const updateNested = useCallback(
    <K extends keyof WorkspaceData>(parent: K, child: string, value: unknown) => {
      setWorkspace((prev) => ({
        ...prev,
        [parent]: { ...(prev[parent] as object), [child]: value },
      }));
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.delete(parent);
        return next;
      });
    },
    []
  );

  const saveSection = async (sectionKey: string) => {
    setGlobalSaving(true);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/workspace/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(workspace),
      });
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.add(sectionKey);
        return next;
      });
    } catch {} finally {
      setGlobalSaving(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/workspace`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      window.location.href = '/login';
    } catch {}
  };

  const channelItems = [
    { key: 'webChat' as const, label: 'Веб-чат', icon: MessageSquare },
    { key: 'telegram' as const, label: 'Telegram', icon: MessageSquare },
    { key: 'whatsapp' as const, label: 'WhatsApp', icon: Phone },
    { key: 'slack' as const, label: 'Slack', icon: MessageSquare },
    { key: 'discord' as const, label: 'Discord', icon: MessageSquare },
    { key: 'email' as const, label: 'Email', icon: Mail },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
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

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Повторить</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Настройки</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Настройки workspace</h1>
            <p className="text-ink-500 mt-1 text-sm">Управляйте настройками и предпочтениями workspace.</p>
          </motion.div>
        </motion.div>

        <div className="space-y-6">
          {/* Company Data */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Building2}
              title="Данные компании"
              description="Публичная информация о компании, контакты и юридические страницы. Эти данные используются на публичных страницах и в ответах агентов."
              saved={savedSections.has('companyData')}
              onSave={() => saveSection('companyData')}
            />
            <div className="max-w-2xl space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-label text-mauve-500 mb-2">Информация</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Название</label>
                    <input type="text" value={workspace.companyName} onChange={(e) => updateWorkspace('companyName', e.target.value)} placeholder='например: AgentCore' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Юр. название / Полное имя</label>
                    <input type="text" value={workspace.legalName} onChange={(e) => updateWorkspace('legalName', e.target.value)} placeholder='ТОО «AgentCore»' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">БИН/ИНН</label>
                    <input type="text" value={workspace.bin} onChange={(e) => updateWorkspace('bin', e.target.value)} placeholder='123456789012' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">ОГРН (опционально)</label>
                    <input type="text" value={workspace.ogrn} onChange={(e) => updateWorkspace('ogrn', e.target.value)} placeholder='1234567890123' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Юр. адрес</label>
                    <input type="text" value={workspace.legalAddress} onChange={(e) => updateWorkspace('legalAddress', e.target.value)} placeholder='г. Алматы, ул. Примерная, 1' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Физ. адрес</label>
                    <input type="text" value={workspace.physicalAddress} onChange={(e) => updateWorkspace('physicalAddress', e.target.value)} placeholder='г. Алматы, ул. Байзакова, 280' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Телефон</label>
                    <input type="text" value={workspace.phone} onChange={(e) => updateWorkspace('phone', e.target.value)} placeholder='+7 (700) 000-00-00' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Email</label>
                    <input type="text" value={workspace.email} onChange={(e) => updateWorkspace('email', e.target.value)} placeholder='hello@agentcore.work' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Часы работы</label>
                    <input type="text" value={workspace.workingHours} onChange={(e) => updateWorkspace('workingHours', e.target.value)} placeholder='Пн-Пт 10:00–19:00 (GMT+5)' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-label text-mauve-500 mb-2">Соцсети / Контакты</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Telegram</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-400">@</span>
                      <input type="text" value={workspace.telegram} onChange={(e) => updateWorkspace('telegram', e.target.value)} placeholder='agentcore' className="w-full pl-7 pr-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">WhatsApp</label>
                    <input type="text" value={workspace.whatsapp} onChange={(e) => updateWorkspace('whatsapp', e.target.value)} placeholder='+77000000000' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-400">@</span>
                      <input type="text" value={workspace.instagram} onChange={(e) => updateWorkspace('instagram', e.target.value)} placeholder='agentcore' className="w-full pl-7 pr-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-label text-mauve-500 mb-2">Юридические страницы</h4>
                <p className="text-xs text-ink-400 mb-3">Редактируемый контент для публичных юридических страниц.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Конфиденциальность</label>
                    <textarea value={workspace.privacyText} onChange={(e) => updateWorkspace('privacyText', e.target.value)} rows={4} placeholder='Текст политики конфиденциальности...' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 resize-y" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Условия</label>
                    <textarea value={workspace.termsText} onChange={(e) => updateWorkspace('termsText', e.target.value)} rows={4} placeholder='Текст условий использования...' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 resize-y" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Возврат</label>
                    <textarea value={workspace.refundText} onChange={(e) => updateWorkspace('refundText', e.target.value)} rows={4} placeholder='Текст политики возврата...' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 resize-y" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1.5">Доставка и оплата</label>
                    <textarea value={workspace.deliveryText} onChange={(e) => updateWorkspace('deliveryText', e.target.value)} rows={4} placeholder='Текст доставки и оплаты...' className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 resize-y" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Workspace Info */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Settings}
              title="О workspace"
              description="Основная информация о workspace."
              saved={savedSections.has('name')}
              onSave={() => saveSection('name')}
            />
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">Название workspace</label>
              <input
                type="text"
                value={workspace.name}
                onChange={(e) => updateWorkspace('name', e.target.value)}
                placeholder="Моя рабочая область"
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
              />
            </div>
          </motion.div>

          {/* Company Details */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Building2}
              title="Детали компании"
              description="Информация о компании для контекста агентов."
              saved={savedSections.has('company')}
              onSave={() => saveSection('company')}
            />
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Размер</label>
                <div className="relative">
                  <select
                    value={workspace.companySize}
                    onChange={(e) => updateWorkspace('companySize', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Выберите размер...</option>
                    {companySizes.map((s) => (
                      <option key={s} value={s}>{s} сотрудников</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Индустрия</label>
                <div className="relative">
                  <select
                    value={workspace.industry}
                    onChange={(e) => updateWorkspace('industry', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Выберите индустрию...</option>
                    {industries.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Регион</label>
                <div className="relative">
                  <select
                    value={workspace.geography}
                    onChange={(e) => updateWorkspace('geography', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Выберите регион...</option>
                    {geographies.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Сайт</label>
                <input
                  type="url"
                  value={workspace.website}
                  onChange={(e) => updateWorkspace('website', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">CRM</label>
                <div className="relative">
                  <select
                    value={workspace.crm}
                    onChange={(e) => updateWorkspace('crm', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Нет</option>
                    {crms.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Communication Channels */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Globe}
              title="Каналы связи"
              description="Выберите каналы, через которые агенты будут принимать и отправлять сообщения. Требуется настройка интеграций."
              saved={savedSections.has('channels')}
              onSave={() => saveSection('channels')}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {channelItems.map((ch) => {
                const isChecked = workspace.channels[ch.key];
                return (
                  <label
                    key={ch.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isChecked
                        ? 'border-mauve-300 bg-mauve-50/50'
                        : 'border-mauve-100 bg-white hover:bg-mauve-50/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updateNested('channels', ch.key, e.target.checked)}
                      className="w-4 h-4 rounded border-mauve-300 text-mauve-600 focus:ring-mauve-500"
                    />
                    <ch.icon className={`w-4 h-4 ${isChecked ? 'text-mauve-600' : 'text-ink-400'}`} />
                    <span className={`text-sm font-medium ${isChecked ? 'text-ink-900' : 'text-ink-500'}`}>
                      {ch.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </motion.div>

          {/* Agent Defaults */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Bot}
              title="Настройки агентов"
              description="Настройки по умолчанию для новых агентов. Температура влияет на креативность: 0 — точные ответы, 2 — более разнообразные и творческие."
              saved={savedSections.has('agentDefaults')}
              onSave={() => saveSection('agentDefaults')}
            />
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Модель по умолчанию</label>
                <div className="relative">
                  <select
                    value={workspace.agentDefaults.model}
                    onChange={(e) => updateNested('agentDefaults', 'model', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5 flex items-center gap-1">
                  Температура <span className="font-mono text-ink-400">{workspace.agentDefaults.temperature.toFixed(1)}</span>
                  <InfoTooltip content="Творческая свобода модели. 0 — точные и предсказуемые ответы. 2 — более креативные и разнообразные. Рекомендуется 0.7 для большинства задач." iconSize={12} />
                </label>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={workspace.agentDefaults.temperature}
                    onChange={(e) => updateNested('agentDefaults', 'temperature', parseFloat(e.target.value))}
                    className="w-full accent-mauve-600 h-2 rounded-full appearance-none bg-mauve-100 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mauve-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95"
                  />
                  <div className="flex justify-between text-[10px] text-ink-400 mt-1">
                    <span>0 — точный</span>
                    <span>2 — креативный</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5 flex items-center gap-1">Макс. токенов <InfoTooltip content="Максимальная длина ответа агента в токенах. 1 токен ≈ 4 символа. Чем выше значение, тем длиннее ответы." iconSize={12} /></label>
                <div className="relative">
                  <select
                    value={workspace.agentDefaults.maxTokens}
                    onChange={(e) => updateNested('agentDefaults', 'maxTokens', parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    {[256, 512, 1024, 2048, 4096, 8192, 16384].map((t) => (
                      <option key={t} value={t}>{t.toLocaleString('ru-RU')}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Bell}
              title="Уведомления"
              description="Настройте уведомления для вашего workspace."
              saved={savedSections.has('notifications')}
              onSave={() => saveSection('notifications')}
            />
            <div className="space-y-4 max-w-md">
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Email-уведомления</p>
                  <p className="text-xs text-ink-500 mt-0.5">Получайте обновления о диалогах и активности агентов.</p>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={workspace.notifications.emailNotifications}
                    onChange={(e) => updateNested('notifications', 'emailNotifications', e.target.checked)}
                    className="sr-only peer"
                    id="email-notif"
                  />
                  <label
                    htmlFor="email-notif"
                    className={`block w-11 h-7 rounded-full cursor-pointer transition-all duration-300 ease-out p-0.5 ${
                      workspace.notifications.emailNotifications ? 'bg-mauve-600' : 'bg-ink-200'
                    }`}
                  >
                    <span
                      className={`block w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-out ${
                        workspace.notifications.emailNotifications ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </label>
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Еженедельный отчёт</p>
                  <p className="text-xs text-ink-500 mt-0.5">Еженедельная сводка аналитики каждый понедельник.</p>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={workspace.notifications.weeklyReport}
                    onChange={(e) => updateNested('notifications', 'weeklyReport', e.target.checked)}
                    className="sr-only peer"
                    id="weekly-report"
                  />
                  <label
                    htmlFor="weekly-report"
                    className={`block w-11 h-7 rounded-full cursor-pointer transition-all duration-300 ease-out p-0.5 ${
                      workspace.notifications.weeklyReport ? 'bg-mauve-600' : 'bg-ink-200'
                    }`}
                  >
                    <span
                      className={`block w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-out ${
                        workspace.notifications.weeklyReport ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            variants={item}
            className="bg-white rounded-2xl border-2 border-red-200/60 shadow-sm p-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center ring-1 ring-red-200 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">Опасная зона</h3>
                <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1">
                  Безвозвратное удаление workspace и всех связанных данных. Это действие нельзя отменить.
                  <InfoTooltip content="При удалении workspace будут безвозвратно удалены: все агенты, диалоги, документы базы знаний, настройки и интеграции. Восстановление невозможно." iconSize={12} />
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all duration-200 shadow-sm shadow-red-600/10 hover:shadow-md hover:shadow-red-600/20"
              >
                Удалить workspace
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 rounded-xl bg-red-50 border border-red-200 mb-0">
                    <p className="text-sm text-red-800 font-semibold mb-2">Вы абсолютно уверены?</p>
                    <p className="text-xs text-red-600 mb-4 leading-relaxed">
                      Workspace, все агенты, диалоги, база знаний и настройки будут удалены безвозвратно.
                      Напишите <strong className="select-none font-mono bg-red-100 px-1.5 py-0.5 rounded">DELETE</strong> ниже для подтверждения.
                    </p>
                    <input
                      type="text"
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      placeholder='Напишите DELETE для подтверждения'
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-red-200 text-sm text-ink-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-300 transition-all duration-200 mb-4"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={deleteText !== 'DELETE'}
                        className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      >
                        Удалить навсегда
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                        className="px-4 py-2.5 rounded-xl border border-ink-200 bg-white text-ink-700 text-sm font-medium hover:bg-ink-50 transition-all duration-200"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
            </div>
          </motion.div>
        </div>

        <div className="h-8" />
      </div>
    </>
  );
}
