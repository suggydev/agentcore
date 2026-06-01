import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentTone = 'formal' | 'friendly' | 'expert' | 'salesy' | 'reserved';
export type ResponseSpeed = 'instant' | 'fast' | 'natural' | 'thoughtful';
export type AggressionHandling = 'calm' | 'empathy' | 'redirect' | 'escalate';

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
  onboarding: OnboardingState;
  onboardingTourCompleted: boolean;
  setWorkspace: (workspace: Partial<WorkspaceData>) => void;
  setPersona: (persona: Partial<AgentPersona>) => void;
  setKnowledge: (knowledge: Partial<KnowledgeConfig>) => void;
  setGoal: (goal: AgentGoal | null) => void;
  completeOnboarding: () => void;
  setOnboardingTourCompleted: () => void;
  resetOnboarding: () => void;
  startTrial: () => void;
  getTrialDaysLeft: () => number;
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

const defaultState: OnboardingState = {
  workspace: defaultWorkspace,
  persona: defaultPersona,
  knowledge: defaultKnowledge,
  goal: null,
  completed: false,
  trialStartedAt: null,
  trialDays: 7,
};

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      onboarding: defaultState,
      onboardingTourCompleted: false,

      setWorkspace: (workspace) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            workspace: { ...state.onboarding.workspace, ...workspace },
          },
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
        set(() => ({
          onboarding: defaultState,
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
    }),
    {
      name: 'agentcore-agent-store',
    }
  )
);
