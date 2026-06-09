'use client';

import { motion } from 'framer-motion';
import {
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SecurityData {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'email' | 'sms' | null;
}

interface SecurityTabProps {
  security: SecurityData;
  setSecurity: React.Dispatch<React.SetStateAction<SecurityData>>;
  oldPassword: string;
  setOldPassword: React.Dispatch<React.SetStateAction<string>>;
  newPassword: string;
  setNewPassword: React.Dispatch<React.SetStateAction<string>>;
  confirmPassword: string;
  setConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
  passwordSaving: boolean;
  passwordSaved: boolean;
  passwordError: string;
  setPasswordError: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  changePassword: () => Promise<void>;
  toggleTwoFactor: () => Promise<void>;
  twoFactorLoading: boolean;
  twoFactorCode: string;
  setTwoFactorCode: React.Dispatch<React.SetStateAction<string>>;
  twoFactorStep: 'idle' | 'sent' | 'verified';
  verifyTwoFactorCode: () => Promise<void>;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function SecurityTab({
  security, setSecurity,
  oldPassword, setOldPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  passwordSaving, passwordSaved, passwordError, setPasswordError,
  showPassword, setShowPassword,
  changePassword,
  toggleTwoFactor,
  twoFactorLoading, twoFactorCode, setTwoFactorCode,
  twoFactorStep,
  verifyTwoFactorCode,
}: SecurityTabProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Lock size={20} className="text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-text">Смена пароля</h3>
            <p className="text-xs text-text-muted">Обновите пароль для безопасности</p>
          </div>
        </div>
        <div className="max-w-md space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Текущий пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => { setOldPassword(e.target.value); setPasswordError(''); }}
                placeholder="Введите текущий пароль"
                className="w-full px-3.5 py-2.5 pr-10 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
              placeholder="Минимум 6 символов"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Подтвердите новый пароль</label>
            <div className="flex gap-3">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                placeholder="Повторите новый пароль"
                className="flex-1 px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
              <button
                onClick={changePassword}
                disabled={passwordSaving || passwordSaved}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                  passwordSaved
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'bg-brand text-white hover:bg-brand-hover'
                }`}
              >
                {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : passwordSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {passwordSaved ? 'Сохранено' : 'Сменить'}
              </button>
            </div>
          </div>
          {passwordError && (
            <div className="flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle size={14} /> {passwordError}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Mail size={20} className="text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text">Двухфакторная аутентификация</h3>
            <p className="text-xs text-text-muted">Код подтверждения на email при входе</p>
          </div>
          <button
            onClick={toggleTwoFactor}
            disabled={twoFactorLoading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              security.twoFactorEnabled
                ? 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25'
                : 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/20'
            }`}
          >
            {twoFactorLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {security.twoFactorEnabled ? 'Отключить' : 'Включить'}
          </button>
        </div>

        {twoFactorStep === 'sent' && !security.twoFactorEnabled && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mt-4">
            <p className="text-sm text-text mb-3">Код подтверждения отправлен на ваш email. Введите его ниже:</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                className="flex-1 px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all text-center tracking-widest"
                maxLength={6}
              />
              <button
                onClick={verifyTwoFactorCode}
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
              >
                {twoFactorLoading ? <Loader2 size={16} className="animate-spin" /> : 'Подтвердить'}
              </button>
            </div>
          </div>
        )}

        {security.twoFactorEnabled && (
          <div className="flex items-center gap-2 mt-4 text-sm text-success">
            <CheckCircle2 size={16} />
            <span>2FA включена через email</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
