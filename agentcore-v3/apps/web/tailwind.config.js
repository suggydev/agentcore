/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        border: 'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          light: 'var(--brand-light)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        mauve: {
          50: '#FDF7FE',
          100: '#F9EEFC',
          200: '#F4D3F9',
          300: '#D4B6D8',
          400: '#A896AB',
          500: '#817080',
          600: '#5A4D59',
          700: '#4A3D49',
          800: '#3A2D39',
          900: '#2A1D29',
        },
        ink: {
          50: '#F8F9FB',
          100: '#F0F1F5',
          150: '#E8EAEF',
          200: '#E2E4EB',
          300: '#C5C9D4',
          400: '#9BA0B0',
          500: '#6B7080',
          600: '#4A4F5C',
          700: '#2D313A',
          800: '#1A1D23',
          900: '#111318',
        },
      },
      fontFamily: {
        sans: ['var(--font-racama)', 'Racama', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-racama)', 'Racama', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        pill: '999px',
      },
      letterSpacing: {
        tight: '-0.03em',
        display: '-0.02em',
        label: '0.08em',
        heading: '-0.01em',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up-sm': 'fadeUpSm 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUpSm: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
