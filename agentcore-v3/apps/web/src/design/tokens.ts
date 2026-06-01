export const tokens = {
  color: {
    light: {
      bg: '#FAFAF7',
      surface: '#FFFFFF',
      surface2: '#F4F2EE',
      border: '#E8E5DF',
      text: '#1A1A1A',
      textMuted: '#6B6B6B',
      accent: '#1A1A1A',
      accentSoft: '#EFEAFE',
      brand: '#6E56CF',
      brandLight: '#6E56CF18',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
    },
    dark: {
      bg: '#0F0F0E',
      surface: '#1A1916',
      surface2: '#242320',
      border: '#2E2D2A',
      text: '#F5F5F0',
      textMuted: '#9A9A9A',
      accent: '#F5F5F0',
      accentSoft: '#6E56CF20',
      brand: '#7C6BD4',
      brandLight: '#7C6BD418',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#F87171',
    },
  },
  radius: {
    card: '12px',
    button: '8px',
    pill: '999px',
    sm: '6px',
  },
  shadow: {
    hover: '0 1px 2px rgba(0,0,0,0.04)',
    card: 'none',
    modal: '0 8px 30px rgba(0,0,0,0.08)',
  },
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  size: {
    h1: '28px', h1Lh: '36px',
    h2: '20px', h2Lh: '28px',
    body: '14px', bodyLh: '22px',
    caption: '12px', captionLh: '16px',
  },
  tracking: {
    heading: '-0.01em',
    body: '0',
    mono: '-0.02em',
  },
  motion: {
    fast: '150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    normal: '200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
} as const;

export type ThemeMode = 'light' | 'dark';
