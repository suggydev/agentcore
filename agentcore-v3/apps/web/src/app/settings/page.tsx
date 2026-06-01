'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  Wallet,
  Shield,
  Users,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Coins,
  ArrowRight,
  Plus,
  Gift,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'subscription', label: 'Подписка', icon: CreditCard },
  { id: 'billing', label: 'Биллинг', icon: Wallet },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'security', label: 'Безопасность', icon: Shield },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface ProfileData {
  name: string;
  email: string;
}

interface BalanceData {
  balance: number;
  toppedUpBalance: number;
  subscriptionCredit: number;
  subscriptionActive: boolean;
  plan: string;
}

interface PlanInfo {
  name: string;
  price: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<ProfileData>({ name: '', email: '' });
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    const load = async () => {
      try {
        const [meRes, balanceRes, planRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/billing/suggy-balance`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/billing/plan`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (meRes.status === 'fulfilled' && meRes.value.ok) {
          const user = await meRes.value.json();
          setProfile({ name: user.name || '', email: user.email || '' });
          if (user.workspace?.settings) {
            const s = user.workspace.settings;
            setProfile((prev) => ({
              ...prev,
              name: s.companyName || user.name || prev.name,
              email: s.email || user.email || prev.email,
            }));
          }
        }
        if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
          setBalanceData(await balanceRes.value.json());
        }
        if (planRes.status === 'fulfilled' && planRes.value.ok) {
          setPlanInfo(await planRes.value.json());
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (res.ok) setProfileSaved(true);
    } catch {
      /* ignore */
    } finally {
      setProfileSaving(false);
    }
  }, [profile]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 1) {
      setTopUpError('Минимальная сумма пополнения $1');
      return;
    }
    setTopUpLoading(true);
    setTopUpError('');
    setTopUpSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/billing/top-up`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTopUpSuccess(`Баланс пополнен на $${amount.toFixed(2)}`);
      setTopUpAmount('');
      const balRes = await fetch(`${API_BASE}/api/billing/suggy-balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (balRes.ok) setBalanceData(await balRes.json());
    } catch (err: unknown) {
      setTopUpError(err instanceof Error ? err.message : 'Ошибка пополнения');
    } finally {
      setTopUpLoading(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }
    setPasswordSaving(true);
    setPasswordSaved(false);
    setPasswordError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setPasswordSaved(true);
        setNewPassword('');
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordError(data.message || 'Не удалось сменить пароль');
      }
    } catch {
      setPasswordError('Ошибка соединения');
    } finally {
      setPasswordSaving(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" role="status" aria-label="Загрузка">
        <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" aria-hidden="true" />
        <span className="sr-only">Загрузка настроек...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={item}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Настройки</p>
          <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Настройки</h1>
          <p className="text-ink-500 mt-1 text-sm">Управление профилем, подпиской и биллингом.</p>
        </motion.div>
      </motion.div>

      <motion.div variants={item} initial="hidden" animate="show" className="flex gap-1 mb-8 bg-white rounded-xl border border-mauve-100 p-1 shadow-sm overflow-x-auto" role="tablist" aria-label="Разделы настроек">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-mauve-500 focus-visible:ring-offset-1 ${
                active
                  ? 'bg-mauve-600 text-white shadow-sm'
                  : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50'
              }`}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${tab.id}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      <div role="tabpanel" id={`tabpanel-${activeTab}`}>
        {activeTab === 'profile' && (
          <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                  <User className="w-[18px] h-[18px] text-mauve-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">Профиль</h3>
                  <p className="text-xs text-ink-500 mt-0.5">Имя и email</p>
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={profileSaving || profileSaved}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-mauve-500 focus-visible:ring-offset-1 ${
                  profileSaved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-mauve-600 text-white hover:bg-mauve-700 shadow-sm shadow-mauve-600/10'
                }`}
              >
                {profileSaved ? <><CheckCircle2 className="w-4 h-4" />Сохранено</> : <><Save className="w-4 h-4" />Сохранить</>}
              </button>
            </div>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Имя</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileSaved(false); }}
                  placeholder="Ваше имя"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => { setProfile((p) => ({ ...p, email: e.target.value })); setProfileSaved(false); }}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Новый пароль</label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordSaved(false); setPasswordError(''); }}
                    placeholder="Минимум 6 символов"
                    className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                  />
                  <button
                    onClick={changePassword}
                    disabled={passwordSaving || passwordSaved}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-mauve-500 focus-visible:ring-offset-1 ${
                      passwordSaved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-mauve-600 text-white hover:bg-mauve-700'
                    }`}
                  >
                    {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : passwordSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {passwordSaved ? 'Сохранено' : 'Сменить'}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'subscription' && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {planInfo && (
              <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                    <CreditCard className="w-6 h-6 text-mauve-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-semibold text-lg text-ink-900">{planInfo.name} План</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mauve-100 text-mauve-600 border border-mauve-200">Текущий</span>
                    </div>
                    <p className="text-sm text-ink-500">{planInfo.price}/мес</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-4">Изменить план</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/settings/upgrade"
                  className="flex items-center gap-3 p-4 rounded-xl border border-mauve-200 hover:border-mauve-400 hover:bg-mauve-50/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-mauve-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5 text-mauve-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Обновить до Pro</p>
                    <p className="text-xs text-ink-500">$10/мес — полный доступ</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-400 ml-auto group-hover:text-mauve-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link
                  href="/settings/upgrade?plan=enterprise"
                  className="flex items-center gap-3 p-4 rounded-xl border border-ink-200 hover:border-ink-400 hover:bg-ink-50/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-ink-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5 text-ink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Enterprise</p>
                    <p className="text-xs text-ink-500">Индивидуальные условия</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-400 ml-auto group-hover:text-ink-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'billing' && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mauve-100 to-mauve-200 flex items-center justify-center ring-1 ring-mauve-100/60">
                    <Wallet className="w-5 h-5 text-mauve-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">Общий баланс</span>
                    <div className="font-mono font-bold text-2xl text-ink-900 tracking-tight">
                      ${balanceData?.balance?.toFixed(2) ?? '0.00'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-mauve-50 via-mauve-50 to-purple-50 rounded-2xl border border-mauve-200 p-6 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/90 flex items-center justify-center ring-1 ring-mauve-200/60">
                    <Gift className="w-5 h-5 text-mauve-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">Кредиты подписки</span>
                    <div className="font-mono font-bold text-2xl text-mauve-700 tracking-tight">
                      ${balanceData?.subscriptionCredit?.toFixed(2) ?? '0.00'}
                    </div>
                    <p className="text-[10px] text-mauve-500 font-medium">обновляются ежемесячно</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                    <Coins className="w-5 h-5 text-mauve-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">Пополнения</span>
                    <div className="font-mono font-bold text-2xl text-ink-900 tracking-tight">
                      ${balanceData?.toppedUpBalance?.toFixed(2) ?? '0.00'}
                    </div>
                    <p className="text-[10px] text-ink-400 font-medium">не сгорают</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-mauve-500" />
                Пополнить баланс
              </h2>
              <p className="text-sm text-ink-500 mb-4">Средства пополнения не сгорают и суммируются с кредитами подписки.</p>
              {topUpError && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-3">{topUpError}</div>}
              {topUpSuccess && <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm mb-3">{topUpSuccess}</div>}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={topUpAmount}
                    onChange={(e) => { setTopUpAmount(e.target.value); setTopUpError(''); }}
                    placeholder="10"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 transition-all text-ink-900 text-sm ${topUpError ? 'border-red-300' : 'border-mauve-200'}`}
                  />
                </div>
                <button
                  onClick={handleTopUp}
                  disabled={topUpLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-mauve-500 focus-visible:ring-offset-1"
                >
                  {topUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Пополнить</>}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setTopUpAmount(String(amt)); setTopUpError(''); }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      topUpAmount === String(amt)
                        ? 'bg-mauve-600 text-white border-mauve-600 shadow-sm shadow-mauve-600/20 scale-105'
                        : 'bg-white text-ink-600 border-mauve-200 hover:border-mauve-400 hover:text-mauve-600'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-4">История платежей</h2>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center mb-4 ring-1 ring-mauve-100/60">
                  <Clock className="w-7 h-7 text-mauve-300" />
                </div>
                <p className="text-ink-500 font-medium mb-1">Нет транзакций</p>
                <p className="text-ink-400 text-sm max-w-xs">Здесь будет отображаться история платежей и пополнений.</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                <Users className="w-[18px] h-[18px] text-mauve-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">Команда</h3>
                <p className="text-xs text-ink-500 mt-0.5">Управление участниками workspace</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center mb-4 ring-1 ring-mauve-100/60">
                <Users className="w-7 h-7 text-mauve-300" />
              </div>
              <p className="text-ink-500 font-medium mb-1">Функция в разработке</p>
              <p className="text-ink-400 text-sm max-w-xs">Управление командой будет доступно в ближайших обновлениях.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                  <Shield className="w-[18px] h-[18px] text-mauve-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">Безопасность</h3>
                  <p className="text-xs text-ink-500 mt-0.5">Двухфакторная аутентификация и сессии</p>
                </div>
              </div>
              <div className="max-w-md space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-ink-100">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Двухфакторная аутентификация</p>
                    <p className="text-xs text-ink-500 mt-0.5">Дополнительный уровень защиты аккаунта</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-ink-100 text-ink-500 font-medium">Скоро</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Активные сессии</p>
                    <p className="text-xs text-ink-500 mt-0.5">Управление устройствами с доступом</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-ink-100 text-ink-500 font-medium">Скоро</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
