'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building2, CreditCard, FileText, Shield, Check, AlertTriangle, Loader2, Phone } from 'lucide-react';
import { getUserRole } from '@/utils/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Tariff {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  agents: number;
  tokens: string;
  integrations: number;
}

interface LegalData {
  companyName: string;
  companyFullName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  legalAddress: string;
  actualAddress: string;
  director: string;
  email: string;
  phone: string;
  supportEmail: string;
  supportPhone: string;
  tariffs: Tariff[];
  lastUpdated: string;
}

export default function AdminLegalPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState<LegalData>({
    companyName: 'ООО «АгентКор»',
    companyFullName: 'Общество с ограниченной ответственностью «АгентКор»',
    inn: '1234567890',
    ogrn: '1234567890123',
    kpp: '123456789',
    legalAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
    actualAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
    director: 'Иванов Иван Иванович',
    email: 'hello@agentcore.work',
    phone: '+7 (999) 123-45-67',
    supportEmail: 'support@agentcore.work',
    supportPhone: '+7 (999) 123-45-67',
    tariffs: [
      {
        id: 'starter',
        name: 'Стартовый',
        price: 4499,
        period: 'единоразово + 1 месяц',
        description: 'Создание и настройка 1 AI-агента + 1 месяц работы',
        features: ['1 AI-агент', '1 000 AI-токенов/мес', '2 интеграции', 'Базовая поддержка', 'Настройка промпта'],
        agents: 1,
        tokens: '1 000',
        integrations: 2,
      },
      {
        id: 'pro',
        name: 'Профессиональный',
        price: 2499,
        period: '/месяц',
        description: 'Поддержка и работа агента + расширенные возможности',
        features: ['1 AI-агент', '10 000 AI-токенов/мес', '10 интеграций', 'Приоритетная поддержка', 'Расширенная аналитика', 'API доступ'],
        agents: 1,
        tokens: '10 000',
        integrations: 10,
      },
      {
        id: 'business',
        name: 'Бизнес',
        price: 9999,
        period: '/месяц',
        description: 'Для компаний с несколькими агентами и высокой нагрузкой',
        features: ['5 AI-агентов', '50 000 AI-токенов/мес', 'Все интеграции', 'Выделенная поддержка 24/7', 'Корпоративная аналитика', 'White-label', 'SLA 99.9%'],
        agents: 5,
        tokens: '50 000',
        integrations: 50,
      },
    ],
    lastUpdated: '06.06.2026',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const role = getUserRole();
    const allowed = ['SUPERADMIN', 'ADMIN'];
    if (!role || !allowed.includes(role)) {
      router.push('/agents');
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    fetchData();
  }, [checked]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : (API_BASE || '');
      const res = await fetch(`${base}/api/legal/legal`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({ ...prev, ...json }));
      } else {
        setError(`Ошибка загрузки: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch legal data:', err);
      setError(err.message || 'Не удалось загрузить данные. Проверьте соединение или отключите AdBlock.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const base = typeof window !== 'undefined' ? window.location.origin : (API_BASE || '');
      const res = await fetch(`${base}/api/legal/legal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка сохранения');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const updateTariff = (index: number, field: keyof Tariff, value: any) => {
    const newTariffs = [...data.tariffs];
    newTariffs[index] = { ...newTariffs[index], [field]: value };
    setData({ ...data, tariffs: newTariffs });
  };

  const updateTariffFeatures = (index: number, features: string[]) => {
    const newTariffs = [...data.tariffs];
    newTariffs[index] = { ...newTariffs[index], features };
    setData({ ...data, tariffs: newTariffs });
  };

  const tabs = [
    { id: 'company', label: 'Реквизиты', icon: Building2 },
    { id: 'contacts', label: 'Контакты', icon: Phone },
    { id: 'tariffs', label: 'Тарифы', icon: CreditCard },
  ];

  if (!checked) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
          <div className="flex items-center gap-2">
            {success && (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <Check className="w-4 h-4" /> Сохранено
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">Юридические данные</h1>
              <p className="text-sm text-[var(--text-muted)]">Редактирование реквизитов, контактов и тарифов для модерации ЮKassa</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[var(--brand)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <h2 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Юридические реквизиты
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Название (краткое)</label>
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={e => setData({ ...data, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Полное название</label>
                  <input
                    type="text"
                    value={data.companyFullName}
                    onChange={e => setData({ ...data, companyFullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">ИНН</label>
                  <input
                    type="text"
                    value={data.inn}
                    onChange={e => setData({ ...data, inn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">ОГРН</label>
                  <input
                    type="text"
                    value={data.ogrn}
                    onChange={e => setData({ ...data, ogrn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">КПП</label>
                  <input
                    type="text"
                    value={data.kpp}
                    onChange={e => setData({ ...data, kpp: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Директор</label>
                  <input
                    type="text"
                    value={data.director}
                    onChange={e => setData({ ...data, director: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Юридический адрес</label>
                  <input
                    type="text"
                    value={data.legalAddress}
                    onChange={e => setData({ ...data, legalAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Фактический адрес</label>
                  <input
                    type="text"
                    value={data.actualAddress}
                    onChange={e => setData({ ...data, actualAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <h2 className="font-semibold text-[var(--text)] mb-4">Контактные данные</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email (основной)</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={e => setData({ ...data, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Телефон</label>
                <input
                  type="text"
                  value={data.phone}
                  onChange={e => setData({ ...data, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email поддержки</label>
                <input
                  type="email"
                  value={data.supportEmail}
                  onChange={e => setData({ ...data, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Телефон поддержки</label>
                <input
                  type="text"
                  value={data.supportPhone}
                  onChange={e => setData({ ...data, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tariffs Tab */}
        {activeTab === 'tariffs' && (
          <div className="space-y-6">
            {data.tariffs.map((tariff, index) => (
              <div key={tariff.id} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[var(--text)] flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Тариф: {tariff.name}
                  </h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--text-muted)]">ID: {tariff.id}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Название</label>
                    <input
                      type="text"
                      value={tariff.name}
                      onChange={e => updateTariff(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Цена (₽)</label>
                    <input
                      type="number"
                      value={tariff.price}
                      onChange={e => updateTariff(index, 'price', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Период</label>
                    <input
                      type="text"
                      value={tariff.period}
                      onChange={e => updateTariff(index, 'period', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Описание</label>
                    <input
                      type="text"
                      value={tariff.description}
                      onChange={e => updateTariff(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Особенности (через запятую)</label>
                    <input
                      type="text"
                      value={tariff.features.join(', ')}
                      onChange={e => updateTariffFeatures(index, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-[var(--text-muted)]">
            Последнее обновление: {data.lastUpdated}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--brand)] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Сохранить изменения
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


