'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Sparkles,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Bot,
  Users,
  FileText,
  Infinity,
  Headphones,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

interface TrialStatus {
  daysLeft: number;
  isTrialing: boolean;
  trialEndsAt: string;
  totalDays?: number;
}

interface PlanInfo {
  name: string;
  price: string;
  conversationsLimit: number;
  agentsLimit: number;
  knowledgeLimit: number;
  features: string[];
}

export default function BillingPage() {
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        const [trialRes, planRes] = await Promise.all([
          fetch(`${API_BASE}/api/billing/trial-status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/billing/plan`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (trialRes.ok) setTrial(await trialRes.json());
        if (planRes.ok) setPlan(await planRes.json());
      } catch {
        setError('Failed to load billing information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  const freeLimits = {
    conversations: 100,
    agents: 1,
    knowledge: 10,
    messagesPerDay: 50,
    channels: 2,
    support: 'Community',
    analytics: 'Basic',
    customModel: false,
    api: false,
    whiteLabel: false,
  };

  const proFeatures = {
    conversations: 'Unlimited',
    agents: 10,
    knowledge: 'Unlimited',
    messagesPerDay: 'Unlimited',
    channels: 'Unlimited',
    support: 'Priority Email',
    analytics: 'Advanced',
    customModel: true,
    api: true,
    whiteLabel: false,
  };

  const enterpriseFeatures = {
    conversations: 'Unlimited',
    agents: 'Unlimited',
    knowledge: 'Unlimited',
    messagesPerDay: 'Unlimited',
    channels: 'Unlimited',
    support: 'Dedicated 24/7',
    analytics: 'Enterprise + Custom',
    customModel: true,
    api: true,
    whiteLabel: true,
  };

  const featureRows = [
    { label: 'Conversations', icon: MessageSquare, free: freeLimits.conversations, pro: proFeatures.conversations, enterprise: enterpriseFeatures.conversations },
    { label: 'AI Agents', icon: Bot, free: freeLimits.agents, pro: proFeatures.agents, enterprise: enterpriseFeatures.agents },
    { label: 'Knowledge Docs', icon: FileText, free: freeLimits.knowledge, pro: proFeatures.knowledge, enterprise: enterpriseFeatures.knowledge },
    { label: 'Messages / Day', icon: MessageSquare, free: freeLimits.messagesPerDay, pro: proFeatures.messagesPerDay, enterprise: enterpriseFeatures.messagesPerDay },
    { label: 'Channels', icon: Zap, free: freeLimits.channels, pro: proFeatures.channels, enterprise: enterpriseFeatures.channels },
    { label: 'Support', icon: Shield, free: freeLimits.support, pro: proFeatures.support, enterprise: enterpriseFeatures.support },
    { label: 'Analytics', icon: BarChart3, free: freeLimits.analytics, pro: proFeatures.analytics, enterprise: enterpriseFeatures.analytics },
    { label: 'Custom Models', icon: Bot, free: freeLimits.customModel, pro: proFeatures.customModel, enterprise: enterpriseFeatures.customModel },
    { label: 'REST API', icon: Zap, free: freeLimits.api, pro: proFeatures.api, enterprise: enterpriseFeatures.api },
    { label: 'White Label', icon: Shield, free: freeLimits.whiteLabel, pro: proFeatures.whiteLabel, enterprise: enterpriseFeatures.whiteLabel },
  ];

  const renderFeatureValue = (value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <X className="w-4 h-4 text-ink-300" />
      );
    }
    return <span className="text-sm font-medium text-ink-700">{value}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  const isTrialing = trial?.isTrialing ?? true;
  const daysLeft = trial?.daysLeft ?? 0;
  const totalTrialDays = trial?.totalDays ?? 14;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Billing</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Plan & Billing</h1>
            <p className="text-ink-500 mt-1 text-sm">Manage your subscription and upgrade plan.</p>
          </motion.div>
        </motion.div>

        {/* Trial Banner */}
        {isTrialing && (
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className={`rounded-2xl border shadow-sm p-6 mb-8 ${
              daysLeft <= 3
                ? 'bg-red-50/60 border-red-200'
                : daysLeft <= 7
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-mauve-50/60 border-mauve-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  daysLeft <= 3 ? 'bg-red-100' : daysLeft <= 7 ? 'bg-amber-100' : 'bg-mauve-100'
                }`}>
                  <Clock className={`w-6 h-6 ${
                    daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-mauve-600'
                  }`} />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg text-ink-900">
                    {daysLeft <= 0 ? 'Trial Expired' : 'Free Trial'}
                  </h2>
                  <p className="text-sm text-ink-500">
                    {daysLeft <= 0
                      ? 'Upgrade to continue using AgentCore with all features.'
                      : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining — enjoy full access to all Pro features.`}
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/billing/upgrade"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10 flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            {daysLeft > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
                  <span>{totalTrialDays - daysLeft} days used</span>
                  <span>{daysLeft} days left</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((totalTrialDays - daysLeft) / totalTrialDays) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className={`h-full rounded-full ${
                      daysLeft <= 3 ? 'bg-red-400' : daysLeft <= 7 ? 'bg-amber-400' : 'bg-mauve-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Plan Details */}
        {plan && (
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                <CreditCard className="w-6 h-6 text-mauve-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-lg text-ink-900">{plan.name} Plan</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mauve-100 text-mauve-600 border border-mauve-200">
                    Current
                  </span>
                </div>
                <p className="text-sm text-ink-500">{plan.price}/month</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h2 variants={item} className="font-display font-semibold text-xl text-ink-900 mb-5">Plans</motion.h2>
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Free / Trial */}
            <motion.div
              variants={item}
              className="bg-white rounded-2xl border-2 border-mauve-100 shadow-sm p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mauve-300 to-mauve-400" />
              <h3 className="font-display font-semibold text-lg text-ink-900 mb-1">Free Trial</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-mono font-bold text-3xl text-ink-900">$0</span>
                <span className="text-sm text-ink-500">/{totalTrialDays} days</span>
              </div>
              <p className="text-sm text-ink-500 mb-4">Try all features before committing.</p>
              <button
                disabled
                className="w-full py-2.5 rounded-xl bg-ink-50 text-ink-400 text-sm font-semibold border border-ink-100 cursor-not-allowed mb-6"
              >
                {isTrialing ? 'Current Plan' : 'Trial Ended'}
              </button>
              <ul className="space-y-2.5">
                {[
                  `${freeLimits.conversations} conversations`,
                  `${freeLimits.agents} agent`,
                  `${freeLimits.knowledge} knowledge docs`,
                  `${freeLimits.messagesPerDay} messages/day`,
                  `${freeLimits.channels} channels`,
                  'Community support',
                  'Basic analytics',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
                    <Check className="w-4 h-4 text-mauve-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Pro */}
            <motion.div
              variants={item}
              className="bg-white rounded-2xl border-2 border-mauve-600 shadow-lg shadow-mauve-600/10 p-6 relative overflow-hidden scale-[1.02]"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mauve-500 to-mauve-600" />
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-mauve-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Popular
              </div>
              <h3 className="font-display font-semibold text-lg text-ink-900 mb-1">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-mono font-bold text-3xl text-ink-900">$29</span>
                <span className="text-sm text-ink-500">/month</span>
              </div>
              <p className="text-sm text-ink-500 mb-4">For growing businesses with multiple channels.</p>
              <a
                href="/dashboard/billing/upgrade"
                className="w-full py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10 mb-6 inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </a>
              <ul className="space-y-2.5">
                {[
                  'Unlimited conversations',
                  '10 AI agents',
                  'Unlimited knowledge',
                  'Unlimited messages/day',
                  'All channels',
                  'Priority email support',
                  'Advanced analytics',
                  'Custom model support',
                  'REST API access',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
                    <Check className="w-4 h-4 text-mauve-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              variants={item}
              className="bg-white rounded-2xl border-2 border-mauve-100 shadow-sm p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ink-400 to-ink-500" />
              <h3 className="font-display font-semibold text-lg text-ink-900 mb-1">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-mono font-bold text-3xl text-ink-900">$99</span>
                <span className="text-sm text-ink-500">/month</span>
              </div>
              <p className="text-sm text-ink-500 mb-4">For organizations needing scale, security, and customization.</p>
              <a
                href="mailto:enterprise@agentcore.ai"
                className="w-full py-2.5 rounded-xl bg-white text-ink-700 text-sm font-semibold border-2 border-mauve-200 hover:bg-mauve-50 hover:border-mauve-400 transition-all duration-200 mb-6 inline-flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Contact Sales
              </a>
              <ul className="space-y-2.5">
                {[
                  'Unlimited everything',
                  'Unlimited agents',
                  'Dedicated 24/7 support',
                  'Enterprise analytics',
                  'Custom model training',
                  'Full API access',
                  'White-label option',
                  'SSO & SAML',
                  'SLA guarantee',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
                    <Check className="w-4 h-4 text-ink-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8">
          <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Feature</th>
                  <th className="text-center py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide w-24">Free</th>
                  <th className="text-center py-3 text-xs font-semibold text-mauve-600 uppercase tracking-wide w-24">Pro</th>
                  <th className="text-center py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide w-24">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, i) => (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="border-b border-ink-50 hover:bg-mauve-50/30 transition-colors"
                  >
                    <td className="py-3 flex items-center gap-2">
                      <row.icon className="w-4 h-4 text-mauve-400" />
                      <span className="text-sm font-medium text-ink-700">{row.label}</span>
                    </td>
                    <td className="py-3 text-center">{renderFeatureValue(row.free)}</td>
                    <td className="py-3 text-center bg-mauve-50/30">{renderFeatureValue(row.pro)}</td>
                    <td className="py-3 text-center">{renderFeatureValue(row.enterprise)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Billing History */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
          <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Billing History</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-mauve-50 flex items-center justify-center mb-4 ring-1 ring-mauve-100/60">
              <CreditCard className="w-6 h-6 text-mauve-400" />
            </div>
            <p className="text-ink-500 font-medium mb-1">No billing history yet</p>
            <p className="text-ink-400 text-sm">Invoices and receipts will appear here after your first payment.</p>
          </div>
        </motion.div>

        <div className="h-8" />
      </div>
    </DashboardLayout>
  );
}
