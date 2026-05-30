'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import Logo from '../../components/Logo';

const API_BASE = 'http://31.76.102.116:4000';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSuccess = async (data: any) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('workspaceId', data.workspaceId);

    if (!isLogin) {
      window.location.href = '/onboarding';
      return;
    }

    try {
      const meRes = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });

      if (meRes.ok) {
        const me = await meRes.json();
        if (me.workspace?.settings?.onboardingCompleted) {
          window.location.href = '/dashboard';
          return;
        }
      }
    } catch {}

    window.location.href = '/onboarding';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { name, email, password, workspaceName: `${name}'s Workspace` };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      await handleAuthSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] relative">
      <div className="absolute inset-0 grid-lines opacity-50" />

      <motion.div
        className="absolute top-20 left-[10%] w-32 h-32 border border-ink-200 rounded-lg opacity-30"
        animate={{ y: [0, -15, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-[15%] w-40 h-40 border border-mauve-400/10 rounded-lg opacity-40"
        animate={{ y: [0, 15, 0], rotate: [0, -1, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white rounded-2xl border border-ink-200 p-8 shadow-sm">
          <div className="text-center mb-8">
            <Logo className="justify-center mb-6" />
            <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="text-ink-400 text-sm">
              {isLogin ? 'Sign in to your workspace' : 'Create your structured workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 transition-all text-ink-900 placeholder:text-ink-300 text-sm"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 transition-all text-ink-900 placeholder:text-ink-300 text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 transition-all text-ink-900 placeholder:text-ink-300 text-sm pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-ink-400 hover:text-ink-700 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
