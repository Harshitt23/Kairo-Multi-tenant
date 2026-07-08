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
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'scale-in': 'scale-in 0.18s ease-out both',
        'dialog-in': 'dialog-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
