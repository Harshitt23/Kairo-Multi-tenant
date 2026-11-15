import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All surface/text tokens resolve through CSS variables (globals.css)
        // so the same classes render both light and dark themes.
        surface: 'rgb(var(--surface) / <alpha-value>)', // page background
        panel: 'rgb(var(--panel) / <alpha-value>)', // cards, dialogs, menus
        elevated: 'rgb(var(--elevated) / <alpha-value>)', // inputs, hovers, fills
        edge: 'rgb(var(--edge) / <alpha-value>)', // borders / hairlines
        ink: 'rgb(var(--ink) / <alpha-value>)', // primary text
        muted: 'rgb(var(--muted) / <alpha-value>)', // secondary text
        faint: 'rgb(var(--faint) / <alpha-value>)', // tertiary text / placeholders
        accent: 'rgb(var(--accent) / <alpha-value>)', // the one brand color
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      boxShadow: {
        // Kept deliberately quiet — depth comes from borders, not shadows.
        card: '0 1px 2px rgb(0 0 0 / 0.04)',
        'card-hover': '0 1px 3px rgb(0 0 0 / 0.07)',
        pop: '0 4px 16px -4px rgb(0 0 0 / 0.12), 0 1px 2px rgb(0 0 0 / 0.06)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Dialogs center themselves with translate(-50%,-50%); the animation
        // transform must carry it or fill-mode "both" wipes the centering.
        'dialog-in': {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // Command palette: scale/lift in while preserving its -50% x-centering.
        'command-in': {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(-4px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.14s ease-out both',
        'dialog-in': 'dialog-in 0.16s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'command-in': 'command-in 0.16s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
