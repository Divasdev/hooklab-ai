import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        amber: 'var(--accent-amber)',
        cyan: 'var(--accent-cyan)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        red: 'var(--accent-error)',
        muted: 'var(--text-muted)',
        border: 'var(--border)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        cyan: 'var(--shadow-cyan)',
        amber: 'var(--shadow-amber)',
        'amber-vivid': 'var(--shadow-amber-vivid)',
      },
      keyframes: {
        cardIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.97)',
            filter: 'blur(4px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)',
          },
        },
        drawLine: {
          '0%': { strokeDashoffset: '260' },
          '100%': { strokeDashoffset: '0' },
        },
        skeletonShimmer: {
          '0%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
          '100%': { opacity: '0.35' },
        },
        triggerPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: 'var(--shadow-trigger-idle)',
          },
          '50%': {
            transform: 'scale(1.04)',
            boxShadow: 'var(--shadow-trigger-peak)',
          },
        },
      },
      animation: {
        cardIn: 'cardIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        drawLine: 'drawLine 780ms cubic-bezier(0.22, 1, 0.36, 1) both',
        skeletonShimmer: 'skeletonShimmer 1.45s ease-in-out infinite',
        triggerPulse: 'triggerPulse 600ms ease-in-out 2',
      },
    },
  },
  plugins: [],
};

export default config;
