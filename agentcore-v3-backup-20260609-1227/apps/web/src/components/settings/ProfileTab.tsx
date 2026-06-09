'use client';

import { motion } from 'framer-motion';
import {
  User,
  Save,
  CheckCircle2,
  Loader2,
  Building2,
  Phone,
  Briefcase,
} from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  companyName: string;
  phone: string;
  industry: string;
  companySize: string;
}

interface ProfileTabProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  profileSaving: boolean;
  profileSaved: boolean;
  saveProfile: () => Promise<void>;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function ProfileTab({ profile, setProfile, profileSaving, profileSaved, saveProfile }: ProfileTabProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <User size={20} className="text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-text">Личная информация</h3>
            <p className="text-xs text-text-muted">Ваши данные и компания</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Имя</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3.5 py-2.5 bg-surface-2 rounded-xl border border-border text-sm text-text-muted cursor-not-allowed"
            />
            <p className="text-[10px] text-text-muted mt-1">Email изменить нельзя</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Название компании</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Телефон</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Отрасль</label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={profile.industry}
                onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">Размер компании</label>
            <select
              value={profile.companySize}
              onChange={(e) => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
            >
              <option value="">Выберите...</option>
              <option value="1">1 человек</option>
              <option value="2-10">2-10 человек</option>
              <option value="11-50">11-50 человек</option>
              <option value="51-200">51-200 человек</option>
              <option value="201-1000">201-1000 человек</option>
              <option value="1000+">1000+ человек</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              profileSaved
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/20'
            }`}
          >
            {profileSaving ? <Loader2 size={16} className="animate-spin" /> : profileSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {profileSaved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
