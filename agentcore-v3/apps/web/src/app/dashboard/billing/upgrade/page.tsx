'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
 Sparkles,
 Check,
 Shield,
 Zap,
 Bot,
 MessageSquare,
 FileText,
 BarChart3,
 Headphones,
 Loader2,
 ArrowRight,
 Mail,
 ChevronDown,
} from 'lucide-react';
import {
 UPGRADE_PLANS,
 buildComparisonRows,
 ENTERPRISE_CONTACT_EMAIL,
 type UpgradePlan,
} from '@/data/pricingConfig';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function UpgradePage() {
 const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
 const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);
 const [enterpriseOpen, setEnterpriseOpen] = useState(false);
 const [enterpriseForm, setEnterpriseForm] = useState({ name: '', email: '', company: '', message: '' });
 const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);

 const handleCheckout = async (planId: string) => {
 setLoadingPlan(planId);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ plan: planId }),
 });

 if (res.ok) {
 const data = await res.json();
 if (data.url) {
 setRedirectingPlan(planId);
 setLoadingPlan(null);
 window.location.href = data.url;
 }
 }
 } catch (err) {
 console.error('Failed to create checkout session:', err);
 } finally {
 if (!redirectingPlan) {
 setLoadingPlan(null);
 }
 }
 };

 const handleEnterpriseSubmit = () => {
 setEnterpriseSubmitted(true);
 setEnterpriseForm({ name: '', email: '', company: '', message: '' });
 setTimeout(() => setEnterpriseSubmitted(false), 5000);
 };

 const renderBool = (val: boolean | string) => {
 if (typeof val === 'boolean') {
 return val ? (
 <Check className="w-4 h-4 text-emerald-500 mx-auto" />
 ) : (
 <span className="text-[var(--text-muted)] text-lg leading-none">—</span>
 );
 }
 return <span className="text-sm font-medium text-[var(--text)]">{val}</span>;
 };

 const container = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
 };
 const item = {
 hidden: { opacity: 0, y: 16 },
 show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
 };

 const comparisonRows = buildComparisonRows();

 const handlePlanAction = (plan: UpgradePlan) => {
 if (plan.id === 'enterprise') {
 setEnterpriseOpen(!enterpriseOpen);
 return;
 }
 if (!plan.btnDisabled) {
 handleCheckout(plan.id.toUpperCase());
 }
 };

 return (
 <>
 <div className="p-6 lg:p-10 max-w-7xl mx-auto">
 {redirectingPlan && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center"
 >
 <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl p-10 text-center max-w-sm mx-auto">
 <Loader2 className="w-10 h-10 text-[var(--brand)] animate-spin mx-auto mb-4" />
 <h3 className="font-display font-semibold text-lg text-[var(--text)] mb-2">Перенаправление...</h3>
 <p className="text-[var(--text-muted)] text-sm">
 Вы будете перенаправлены на страницу оформления заказа.
 </p>
 </div>
 </motion.div>
 )}

 <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
 <motion.div variants={item}>
 <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Обновление</p>
 <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Выберите план</h1>
 <p className="text-[var(--text-muted)] mt-1 text-sm">Выберите план, подходящий для вашего бизнеса.</p>
 </motion.div>
 </motion.div>

 {/* Plan Cards */}
 <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-6 mb-12">
 {UPGRADE_PLANS.map((plan) => (
 <motion.div
 key={plan.id}
 variants={item}
 whileHover={!plan.btnDisabled ? { y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : {}}
 className={`relative rounded-2xl border-2 ${plan.accentClass} p-6 overflow-hidden group ${plan.popular ? 'scale-[1.02] z-10' : ''}`}
 >
 <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.topBarGradient}`} />
 {plan.badge && (
 <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider">
 {plan.badge}
 </div>
 )}
 <h3 className="font-display font-semibold text-lg text-[var(--text)] mb-1">{plan.name}</h3>
 <div className="flex items-baseline gap-1 mb-3">
 <span className="font-mono font-bold text-3xl text-[var(--text)]">{plan.price}</span>
 <span className="text-sm text-[var(--text-muted)]">{plan.period}</span>
 </div>
 <p className="text-sm text-[var(--text-muted)] mb-5">{plan.description}</p>
 <button
 onClick={() => handlePlanAction(plan)}
 disabled={plan.btnDisabled}
 className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${plan.btnClass}`}
 >
 {loadingPlan === plan.id.toUpperCase() ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : plan.id === 'enterprise' ? (
 <>
 {enterpriseOpen ? (
 <>
 <ChevronDown className="w-4 h-4 transition-transform duration-200" />
 Скрыть форму
 </>
 ) : (
 <>
 <Shield className="w-4 h-4" />
 {plan.btnLabel}
 </>
 )}
 </>
 ) : plan.btnIcon ? (
 <>
 <plan.btnIcon className="w-4 h-4" />
 {plan.btnLabel}
 </>
 ) : (
 plan.btnLabel
 )}
 </button>

 {/* Enterprise contact form */}
 {plan.id === 'enterprise' && enterpriseOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="mt-5 pt-5 border-t border-[var(--border)] overflow-hidden"
 >
 {enterpriseSubmitted ? (
 <div className="text-center py-3">
 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
 <Check className="w-5 h-5 text-emerald-600" />
 </div>
 <p className="text-sm font-medium text-[var(--text)]">Заявка отправлена!</p>
 <p className="text-xs text-[var(--text-muted)] mt-1">Мы свяжемся с вами в ближайшее время.</p>
 </div>
 ) : (
 <div className="space-y-3">
 <input
 type="text"
 placeholder="Ваше имя"
 value={enterpriseForm.name}
 onChange={(e) => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })}
 className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--brand)] focus:ring-1 focus-visible:ring-[var(--brand)] transition-colors"
 />
 <input
 type="email"
 placeholder="Email"
 value={enterpriseForm.email}
 onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
 className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--brand)] focus:ring-1 focus-visible:ring-[var(--brand)] transition-colors"
 />
 <input
 type="text"
 placeholder="Компания"
 value={enterpriseForm.company}
 onChange={(e) => setEnterpriseForm({ ...enterpriseForm, company: e.target.value })}
 className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--brand)] focus:ring-1 focus-visible:ring-[var(--brand)] transition-colors"
 />
 <textarea
 placeholder="Кратко опишите ваши потребности"
 rows={3}
 value={enterpriseForm.message}
 onChange={(e) => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })}
 className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--brand)] focus:ring-1 focus-visible:ring-[var(--brand)] transition-colors resize-none"
 />
 <button
 onClick={handleEnterpriseSubmit}
 className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-colors duration-200 flex items-center justify-center gap-2"
 >
 <Mail className="w-4 h-4" />
 Отправить заявку
 </button>
 <p className="text-[10px] text-[var(--text-muted)] text-center">
 Или напишите на{' '}
 <a
 href={`mailto:${ENTERPRISE_CONTACT_EMAIL}`}
 className="text-[var(--brand)] hover:text-[var(--brand)] underline"
 >
 {ENTERPRISE_CONTACT_EMAIL}
 </a>
 </p>
 </div>
 )}
 </motion.div>
 )}

 <ul className="space-y-2.5 mt-6">
 {plan.features.map((f, i) => (
 <li key={i} className="flex items-center gap-2 text-sm text-[var(--text)]">
 <Check className={`w-4 h-4 ${plan.popular ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} flex-shrink-0`} />
 {f}
 </li>
 ))}
 </ul>
 </motion.div>
 ))}
 </motion.div>

 {/* Feature Comparison Table */}
 <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 mb-8">
 <h2 className="font-display font-semibold text-lg text-[var(--text)] mb-5">Сравнение функций</h2>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-[var(--border)]">
 <th className="text-left py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Функция</th>
 <th className="text-center py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-24">Starter</th>
 <th className="text-center py-3 text-xs font-semibold text-[var(--brand)] uppercase tracking-wide w-24">Pro</th>
 <th className="text-center py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-24">Enterprise</th>
 </tr>
 </thead>
 <tbody>
 {comparisonRows.map((row, i) => (
 <motion.tr
 key={row.feature}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.3 + i * 0.03 }}
 className="border-b border-[var(--border)] hover:bg-[var(--accent-soft)]/30 transition-colors"
 >
 <td className="py-3 flex items-center gap-2">
 <row.icon className="w-4 h-4 text-[var(--text-muted)]" />
 <span className="text-sm font-medium text-[var(--text)]">{row.feature}</span>
 </td>
 <td className="py-3 text-center">{renderBool(row.starter)}</td>
 <td className="py-3 text-center bg-[var(--accent-soft)]/30">{renderBool(row.pro)}</td>
 <td className="py-3 text-center">{renderBool(row.enterprise)}</td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </motion.div>

 {/* Guarantee */}
 <motion.div variants={item} initial="hidden" animate="show" className="text-center pb-8">
 <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border)]">
 <Shield className="w-5 h-5 text-[var(--brand)]" />
 <span className="text-sm text-[var(--brand)] font-medium">
 14-дневный бесплатный пробный период — без привязки карты. Отмена в любое время.
 </span>
 </div>
 </motion.div>

 <div className="h-8" />
 </div>
 </>
 );
}
