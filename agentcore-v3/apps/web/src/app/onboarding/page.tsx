'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Headphones,
  MessageCircle,
  Building2,
  Pen,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  Check,
  ChevronRight,
} from 'lucide-react';
import Logo from '../../components/Logo';

const API_BASE = 'http://31.76.102.116:4000';

interface FormData {
  companyName: string;
  companySize: string;
  industry: string;
  geography: string;
  channels: string[];
  websiteUrl: string;
  crm: string;
  agentGoal: string;
}

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
  'Real Estate', 'Consulting', 'Manufacturing', 'Other',
];
const GEOGRAPHIES = [
  'Global', 'Europe', 'North America', 'Asia',
  'South America', 'Africa', 'Middle East', 'Russia/CIS',
];
const CHANNELS = [
  'Web Chat', 'Telegram', 'WhatsApp', 'Email', 'Phone', 'Slack', 'Discord',
];
const CRMS = [
  'None', 'HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Bitrix24', 'AmoCRM', 'Custom',
];

const GOALS = [
  {
    id: 'sales',
    icon: TrendingUp,
    label: 'Sales',
    description: 'Generate leads, qualify, increase conversion',
  },
  {
    id: 'support',
    icon: Headphones,
    label: 'Support',
    description: 'Answer questions, resolve issues, reduce tickets',
  },
  {
    id: 'consulting',
    icon: MessageCircle,
    label: 'Consulting',
    description: 'Qualify clients, schedule meetings, provide info',
  },
  {
    id: 'internal',
    icon: Building2,
    label: 'Internal',
    description: 'Automate internal processes, onboarding, training',
  },
  {
    id: 'custom',
    icon: Pen,
    label: 'Custom',
    description: 'Define your own scenario',
  },
];

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const [form, setForm] = useState<FormData>({
    companyName: '',
    companySize: '',
    industry: '',
    geography: '',
    channels: [],
    websiteUrl: '',
    crm: '',
    agentGoal: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      window.location.href = '/login';
      return;
    }
    setToken(t);
  }, []);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const canContinueStep1 =
    form.companyName.trim() !== '' &&
    form.companySize !== '' &&
    form.industry !== '' &&
    form.geography !== '';

  const handleSkip = () => {
    window.location.href = '/dashboard';
  };

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        companyName: form.companyName,
        companySize: form.companySize,
        industry: form.industry,
        geography: form.geography,
        channels: form.channels,
        websiteUrl: form.websiteUrl,
        crm: form.crm,
        agentGoal: form.agentGoal,
      };

      const res = await fetch(`${API_BASE}/api/workspace/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      window.location.href = '/dashboard/agents';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [form, token]);

  const handleSkipForNow = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/workspace/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skipped: true }),
      });
    } catch {}
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] relative flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-lines opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size={36} />
        </div>

        {/* Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 px-5 py-4 rounded-2xl bg-gradient-to-r from-mauve-100/80 via-mauve-200/40 to-mauve-100/80 border border-mauve-200/60 flex items-center gap-4 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-mauve-500 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-mauve-700">
              Welcome! You have 7 days of full access
            </p>
            <p className="text-xs text-mauve-500 mt-0.5">No card required</p>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <Step1
                key="step1"
                form={form}
                update={update}
                toggleChannel={toggleChannel}
              />
            ) : (
              <Step2
                key="step2"
                form={form}
                update={update}
              />
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="flex items-center justify-between mt-6">
              <div>
                {step === 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSkipForNow}
                  disabled={loading}
                  className="text-sm text-ink-400 hover:text-ink-600 transition-colors font-medium"
                >
                  Skip for now
                </button>

                {step === 0 ? (
                  <button
                    type="button"
                    disabled={!canContinueStep1}
                    onClick={() => setStep(1)}
                    className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-mauve-600"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!form.agentGoal || loading}
                    onClick={handleSubmit}
                    className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-mauve-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Get Started <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step === 0 ? 'bg-mauve-600 w-6' : 'bg-mauve-200'
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step === 1 ? 'bg-mauve-600 w-6' : 'bg-mauve-200'
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Step 1: Company Setup ---------------- */

function Step1({
  form,
  update,
  toggleChannel,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  toggleChannel: (ch: string) => void;
}) {
  return (
    <motion.div {...slideUp} className="px-8 pt-8 pb-2">
      <div className="mb-7">
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-1.5">
          Tell us about your workspace
        </h2>
        <p className="text-sm text-ink-400">
          Help us configure AgentCore for your needs
        </p>
      </div>

      <div className="space-y-4">
        {/* Company Name */}
        <div className="p-4 rounded-xl border border-mauve-100 bg-[#F8F9FB] transition-all focus-within:ring-2 focus-within:ring-mauve-400/20 focus-within:border-mauve-400 focus-within:bg-white">
          <label className="block text-xs font-semibold uppercase tracking-label text-mauve-500 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={form.companyName}
            onChange={e => update('companyName', e.target.value)}
            placeholder="Acme Inc."
            className="w-full bg-transparent text-ink-900 text-sm placeholder:text-ink-300 outline-none"
          />
        </div>

        {/* Company Size */}
        <SelectField
          label="Company Size"
          value={form.companySize}
          onChange={v => update('companySize', v)}
          options={COMPANY_SIZES}
          placeholder="Select size"
        />

        {/* Industry */}
        <SelectField
          label="Industry"
          value={form.industry}
          onChange={v => update('industry', v)}
          options={INDUSTRIES}
          placeholder="Select industry"
        />

        {/* Geography */}
        <SelectField
          label="Geography"
          value={form.geography}
          onChange={v => update('geography', v)}
          options={GEOGRAPHIES}
          placeholder="Select region"
        />

        {/* Communication Channels */}
        <div className="p-4 rounded-xl border border-mauve-100 bg-[#F8F9FB]">
          <label className="block text-xs font-semibold uppercase tracking-label text-mauve-500 mb-3">
            Primary Communication Channels
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(ch => {
              const selected = form.channels.includes(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    selected
                      ? 'bg-mauve-600 text-white border-mauve-600 shadow-sm shadow-mauve-600/10'
                      : 'bg-white text-ink-500 border-ink-200 hover:border-mauve-300 hover:text-mauve-600'
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {ch}
                </button>
              );
            })}
          </div>
        </div>

        {/* Website URL */}
        <div className="p-4 rounded-xl border border-mauve-100 bg-[#F8F9FB] transition-all focus-within:ring-2 focus-within:ring-mauve-400/20 focus-within:border-mauve-400 focus-within:bg-white">
          <label className="block text-xs font-semibold uppercase tracking-label text-mauve-500 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={e => update('websiteUrl', e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-transparent text-ink-900 text-sm placeholder:text-ink-300 outline-none"
          />
        </div>

        {/* CRM */}
        <SelectField
          label="CRM"
          value={form.crm}
          onChange={v => update('crm', v)}
          options={CRMS}
          placeholder="Select CRM"
        />
      </div>
    </motion.div>
  );
}

/* ---------------- Step 2: Agent Goal ---------------- */

function Step2({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <motion.div {...slideUp} className="px-8 pt-8 pb-2">
      <div className="mb-7">
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-1.5">
          What should your agent do?
        </h2>
        <p className="text-sm text-ink-400">
          Choose the primary goal for your AI agent
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {GOALS.map(goal => {
          const selected = form.agentGoal === goal.id;
          const Icon = goal.icon;
          return (
            <motion.button
              key={goal.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => update('agentGoal', goal.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${
                selected
                  ? 'bg-mauve-50 border-mauve-400 shadow-md shadow-mauve-400/10 ring-1 ring-mauve-400/30'
                  : 'bg-[#F8F9FB] border-mauve-100 hover:border-mauve-300 hover:shadow-sm hover:bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  selected ? 'bg-mauve-600' : 'bg-mauve-100'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    selected ? 'text-white' : 'text-mauve-600'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`font-semibold text-sm transition-colors duration-300 ${
                    selected ? 'text-mauve-700' : 'text-ink-900'
                  }`}
                >
                  {goal.label}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">{goal.description}</p>
              </div>
              {selected && (
                <div className="ml-auto flex-shrink-0 self-center">
                  <div className="w-5 h-5 rounded-full bg-mauve-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Preview Card */}
      {form.agentGoal && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 rounded-xl border border-mauve-200 bg-gradient-to-br from-mauve-50/60 to-white"
        >
          <p className="text-xs font-semibold uppercase tracking-label text-mauve-500 mb-3">
            Create your first agent
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center shadow-sm shadow-mauve-400/20">
              {(() => {
                const goal = GOALS.find(g => g.id === form.agentGoal);
                if (!goal) return null;
                const Icon = goal.icon;
                return <Icon className="w-4 h-4 text-white" />;
              })()}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {GOALS.find(g => g.id === form.agentGoal)?.label} Agent
              </p>
              <p className="text-xs text-ink-400 mt-0.5">
                Ready to configure after onboarding
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------------- Shared: Select Field ---------------- */

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-mauve-100 bg-[#F8F9FB] transition-all focus-within:ring-2 focus-within:ring-mauve-400/20 focus-within:border-mauve-400 focus-within:bg-white">
      <label className="block text-xs font-semibold uppercase tracking-label text-mauve-500 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-ink-900 text-sm outline-none cursor-pointer appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239BA0B0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 4px center',
          paddingRight: '24px',
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
