import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export type AgentTone = 'formal' | 'friendly' | 'expert' | 'salesy' | 'reserved';
export type ResponseSpeed = 'instant' | 'fast' | 'natural' | 'thoughtful';
export type AggressionHandling = 'calm' | 'empathy' | 'redirect' | 'escalate';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface WorkspaceSettings {
  name: string;
  companyName: string;
  companySize: string;
  industry: string;
  geography: string;
  website: string;
  crm: string;
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

export interface BillingState {
  balance: number;
  toppedUpBalance: number;
  subscriptionCredit: number;
  subscriptionActive: boolean;
  plan: string | null;
  trialDaysLeft: number;
  isTrialing: boolean;
}

export interface WorkspaceData {
  companyName: string;
  companySize: string;
  industry: string;
  geography: string;
  channels: string[];
  websiteUrl: string;
  crm: string;
}

export interface AgentPersona {
  name: string;
  greeting: string;
  tone: AgentTone;
  responseSpeed: ResponseSpeed;
  useEmoji: boolean;
  useHumor: boolean;
  showEmotions: boolean;
  forbiddenWords: string;
  aggressionHandling: AggressionHandling;
  admitNotKnowing: boolean;
  adaptToUserStyle: boolean;
  rememberContext: boolean;
  notPushy: boolean;
}

export interface KnowledgeConfig {
  websiteUrl: string;
  documents: string[];
  faqText: string;
  notionUrl: string;
  googleDriveUrl: string;
}

export interface AgentGoal {
  id: string;
  label: string;
  description: string;
}

export interface OnboardingState {
  workspace: WorkspaceData;
  persona: AgentPersona;
  knowledge: KnowledgeConfig;
  goal: AgentGoal | null;
  completed: boolean;
  trialStartedAt: string | null;
  trialDays: number;
}

export interface AgentStore {
  auth: {
    token: string;
    isAuthenticated: boolean;
    user: UserProfile | null;
    workspaceId: string;
  };
  billing: BillingState;
  workspaceSettings: Partial<WorkspaceSettings>;
  onboarding: OnboardingState;
  onboardingTourCompleted: boolean;
  ui: {
    sidebarMobileOpen: boolean;
    commandPaletteOpen: boolean;
    onBoardingTourVisible: boolean;
  };

  setAuth: (token: string, user: UserProfile | null, workspaceId: string) => void;
  clearAuth: () => void;
  setBilling: (billing: Partial<BillingState>) => void;
  setWorkspace: (workspace: Partial<WorkspaceData>) => void;
  setWorkspaceSettings: (settings: Partial<WorkspaceSettings>) => void;
  setPersona: (persona: Partial<AgentPersona>) => void;
  setKnowledge: (knowledge: Partial<KnowledgeConfig>) => void;
  setGoal: (goal: AgentGoal | null) => void;
  completeOnboarding: () => void;
  setOnboardingTourCompleted: () => void;
  resetOnboarding: () => void;
  startTrial: () => void;
  getTrialDaysLeft: () => number;
  setSidebarMobileOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setOnboardingTourVisible: (visible: boolean) => void;
  logout: () => void;
}

const defaultWorkspace: WorkspaceData = {
  companyName: '',
  companySize: '',
  industry: '',
  geography: '',
  channels: [],
  websiteUrl: '',
  crm: '',
};

const defaultPersona: AgentPersona = {
  name: '',
  greeting: '',
  tone: 'friendly',
  responseSpeed: 'natural',
  useEmoji: true,
  useHumor: false,
  showEmotions: true,
  forbiddenWords: '',
  aggressionHandling: 'empathy',
  admitNotKnowing: true,
  adaptToUserStyle: true,
  rememberContext: true,
  notPushy: true,
};

const defaultKnowledge: KnowledgeConfig = {
  websiteUrl: '',
  documents: [],
  faqText: '',
  notionUrl: '',
  googleDriveUrl: '',
};

const defaultOnboarding: OnboardingState = {
  workspace: defaultWorkspace,
  persona: defaultPersona,
  knowledge: defaultKnowledge,
  goal: null,
  completed: false,
  trialStartedAt: null,
  trialDays: 7,
};

const defaultBilling: BillingState = {
  balance: 0,
  toppedUpBalance: 0,
  subscriptionCredit: 0,
  subscriptionActive: false,
  plan: null,
  trialDaysLeft: 0,
  isTrialing: false,
};

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      auth: {
        token: '',
        isAuthenticated: false,
        user: null,
        workspaceId: '',
      },
      billing: defaultBilling,
      workspaceSettings: {},
      onboarding: defaultOnboarding,
      onboardingTourCompleted: false,
      ui: {
        sidebarMobileOpen: false,
        commandPaletteOpen: false,
        onBoardingTourVisible: false,
      },

      setAuth: (token, user, workspaceId) =>
        set({
          auth: {
            token,
            isAuthenticated: !!token,
            user,
            workspaceId,
          },
        }),

      clearAuth: () =>
        set({
          auth: { token: '', isAuthenticated: false, user: null, workspaceId: '' },
          billing: defaultBilling,
        }),

      setBilling: (billing) =>
        set((state) => ({
          billing: { ...state.billing, ...billing },
        })),

      setWorkspace: (workspace) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            workspace: { ...state.onboarding.workspace, ...workspace },
          },
        })),

      setWorkspaceSettings: (settings) =>
        set((state) => ({
          workspaceSettings: { ...state.workspaceSettings, ...settings },
        })),

      setPersona: (persona) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            persona: { ...state.onboarding.persona, ...persona },
          },
        })),

      setKnowledge: (knowledge) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            knowledge: { ...state.onboarding.knowledge, ...knowledge },
          },
        })),

      setGoal: (goal) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            goal,
          },
        })),

      completeOnboarding: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            completed: true,
          },
        })),

      setOnboardingTourCompleted: () =>
        set({ onboardingTourCompleted: true }),

      resetOnboarding: () =>
        set((state) => ({
          onboarding: defaultOnboarding,
        })),

      startTrial: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            trialStartedAt: new Date().toISOString(),
          },
        })),

      getTrialDaysLeft: () => {
        const state = get();
        if (!state.onboarding.trialStartedAt) return state.onboarding.trialDays;
        const start = new Date(state.onboarding.trialStartedAt).getTime();
        const now = Date.now();
        const diff = now - start;
        const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
        return Math.max(0, state.onboarding.trialDays - daysPassed);
      },

      setSidebarMobileOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, sidebarMobileOpen: open },
        })),

      setCommandPaletteOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, commandPaletteOpen: open },
        })),

      setOnboardingTourVisible: (visible) =>
        set((state) => ({
          ui: { ...state.ui, onBoardingTourVisible: visible },
        })),

      logout: () => {
        const token = get().auth.token;
        if (token) {
          fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        if (typeof window !== 'undefined') {
          localStorage.clear();
          document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        }
        set({
          auth: { token: '', isAuthenticated: false, user: null, workspaceId: '' },
          billing: defaultBilling,
        });
      },
    }),
    {
      name: 'agentcore-agent-store',
      partialize: (state) => ({
        onboarding: state.onboarding,
        onboardingTourCompleted: state.onboardingTourCompleted,
        workspaceSettings: state.workspaceSettings,
      }),
    }
  )
);
