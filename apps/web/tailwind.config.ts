import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light/day surfaces. Names kept from the original dark theme so every
        // existing `bg-panel` / `bg-elevated` / `border-edge` class keeps working.
        surface: '#f5f6f8', // page background — slightly grey so white panels pop
        panel: '#ffffff', // cards, dialogs, menus, main content
        elevated: '#eef0f3', // inputs, secondary/ghost fills, skeletons, hover
        edge: '#e2e5ea', // borders / hairlines
        // Semantic text tokens.
        ink: '#101828', // strong headings / primary text
        muted: '#667085', // secondary / muted text
        accent: '#6366f1', // brand indigo
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
      },
      backgroundImage: {
        brand: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -8px rgba(16,24,40,0.18)',
        glow: '0 8px 24px -8px rgba(99,102,241,0.45)',
        // Slightly stronger lift for hover states on interactive cards.
        'card-hover': '0 2px 4px rgba(16,24,40,0.06), 0 12px 28px -10px rgba(16,24,40,0.22)',
      },
      transitionTimingFunction: {
        // The signature "out-expo"-ish easing used across the app's motion.
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Dialogs center themselves with translate(-50%,-50%); the animation
        // transform must carry it or fill-mode "both" wipes the centering.
        'dialog-in': {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        // A light sweeping sheen for skeleton loaders.
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // Command palette: scale/lift in while preserving its -50% x-centering.
        'command-in': {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(-6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.18s ease-out both',
        'dialog-in': 'dialog-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'command-in': 'command-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
