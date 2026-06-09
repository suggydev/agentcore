'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Users,
  CreditCard,
  Link2,
  Loader2,
} from 'lucide-react';
import ProfileTab from '@/components/settings/ProfileTab';
import SecurityTab from '@/components/settings/SecurityTab';
import TeamTab from '@/components/settings/TeamTab';
import BillingTab from '@/components/settings/BillingTab';
import IntegrationsTab from '@/components/settings/IntegrationsTab';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ProfileData {
  name: string;
  email: string;
  companyName: string;
  phone: string;
  industry: string;
  companySize: string;
}

interface SecurityData {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'email' | 'sms' | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'team' | 'billing' | 'integrations'>('profile');
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', companyName: '', phone: '', industry: '', companySize: ''
  });
  const [security, setSecurity] = useState<SecurityData>({ twoFactorEnabled: false, twoFactorMethod: null });
  const [loading, setLoading] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [billingData, setBillingData] = useState<{ balance: number; transactions: { id: string; amount: number; description: string; createdAt: string }[] }>({ balance: 0, transactions: [] });
  const [billingLoading, setBillingLoading] = useState(false);
  const [integrations, setIntegrations] = useState<{ id: string; name: string; type: string; connected: boolean }[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const controller = new AbortController();
    const load = async () => {
      try {
        const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (meRes.ok) {
          const user = await meRes.json();
          setProfile({
            name: user.name || '',
            email: user.email || '',
            companyName: user.workspace?.settings?.companyName || '',
            phone: user.workspace?.settings?.phone || '',
            industry: user.workspace?.settings?.industry || '',
            companySize: user.workspace?.settings?.companySize || '',
          });
          setSecurity({
            twoFactorEnabled: user.twoFactorEnabled || false,
            twoFactorMethod: user.twoFactorMethod || null,
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (process.env.NODE_ENV === 'development') console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (activeTab !== 'billing') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const controller = new AbortController();
    setBillingLoading(true);
    fetch(`${API_BASE}/api/billing/balance`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setBillingData(prev => ({ ...prev, balance: data.balance ?? 0, transactions: data.transactions ?? [] })))
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('[Settings] Failed to load billing:', err);
      })
      .finally(() => setBillingLoading(false));
    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'integrations') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const controller = new AbortController();
    setIntegrationsLoading(true);
    fetch(`${API_BASE}/api/integrations`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setIntegrations(data.integrations ?? data ?? []))
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('[Settings] Failed to load integrations:', err);
      })
      .finally(() => setIntegrationsLoading(false));
    return () => controller.abort();
  }, [activeTab]);

  const saveProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name }),
      });
      const res = await fetch(`${API_BASE}/api/workspace`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyName: profile.companyName,
          phone: profile.phone,
          industry: profile.industry,
          companySize: profile.companySize,
        }),
      });
      if (res.ok) setProfileSaved(true);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[Settings] saveProfile:', err);
    } finally {
      setProfileSaving(false);
    }
  }, [profile]);

  const changePassword = async () => {
    if (!oldPassword) { setPasswordError('Введите текущий пароль'); return; }
    if (!newPassword || newPassword.length < 6) { setPasswordError('Пароль должен быть не менее 6 символов'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Пароли не совпадают'); return; }
    setPasswordSaving(true);
    setPasswordSaved(false);
    setPasswordError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordSaved(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Не удалось сменить пароль');
      }
    } catch {
      setPasswordError('Ошибка соединения');
    } finally {
      setPasswordSaving(false);
    }
  };

  const toggleTwoFactor = async () => {
    if (security.twoFactorEnabled) {
      setTwoFactorLoading(true);
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/api/auth/2fa/disable`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        setSecurity(prev => ({ ...prev, twoFactorEnabled: false, twoFactorMethod: null }));
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('[Settings] disable 2FA:', err);
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      setTwoFactorLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/auth/2fa/send-code`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setTwoFactorStep('sent');
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('[Settings] send 2FA code:', err);
      } finally {
        setTwoFactorLoading(false);
      }
    }
  };

  const verifyTwoFactorCode = async () => {
    if (!twoFactorCode.trim()) return;
    setTwoFactorLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      if (res.ok) {
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true, twoFactorMethod: 'email' }));
        setTwoFactorStep('verified');
        setTwoFactorCode('');
      } else {
        setPasswordError('Неверный код');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[Settings] verify 2FA:', err);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" role="status">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={item}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand mb-2">Аккаунт</p>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text tracking-tight">Настройки</h1>
          <p className="text-text-muted mt-1">Управление профилем и безопасностью</p>
        </motion.div>
      </motion.div>

      <div className="flex gap-2 mb-8">
        {[
          { id: 'profile' as const, label: 'Профиль', icon: User },
          { id: 'security' as const, label: 'Безопасность', icon: Shield },
          { id: 'team' as const, label: 'Команда', icon: Users },
          { id: 'billing' as const, label: 'Оплата', icon: CreditCard },
          { id: 'integrations' as const, label: 'Интеграции', icon: Link2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface-3'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <ProfileTab
          profile={profile}
          setProfile={setProfile}
          profileSaving={profileSaving}
          profileSaved={profileSaved}
          saveProfile={saveProfile}
        />
      )}

      {activeTab === 'security' && (
        <SecurityTab
          security={security}
          setSecurity={setSecurity}
          oldPassword={oldPassword}
          setOldPassword={setOldPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordSaving={passwordSaving}
          passwordSaved={passwordSaved}
          passwordError={passwordError}
          setPasswordError={setPasswordError}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          changePassword={changePassword}
          toggleTwoFactor={toggleTwoFactor}
          twoFactorLoading={twoFactorLoading}
          twoFactorCode={twoFactorCode}
          setTwoFactorCode={setTwoFactorCode}
          twoFactorStep={twoFactorStep}
          verifyTwoFactorCode={verifyTwoFactorCode}
        />
      )}

      {activeTab === 'team' && <TeamTab />}

      {activeTab === 'billing' && (
        <BillingTab billingData={billingData} billingLoading={billingLoading} />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsTab integrations={integrations} integrationsLoading={integrationsLoading} />
      )}
    </div>
  );
}
