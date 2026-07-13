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
        // Wider gradient the landing page's CTAs slide across on hover for a sheen effect.
        'brand-sheen': 'linear-gradient(120deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -8px rgba(16,24,40,0.18)',
        glow: '0 8px 24px -8px rgba(99,102,241,0.45)',
        'glow-lg': '0 16px 32px -6px rgba(99,102,241,0.6)',
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
        // Auth card: a gentle indigo-tinted shadow pulse (login/signup screen).
        'card-glow': {
          '0%, 100%': {
            boxShadow:
              '0 20px 60px -20px rgba(16,24,40,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
          },
          '50%': {
            boxShadow:
              '0 24px 70px -18px rgba(99,102,241,0.22), 0 0 0 1px rgba(255,255,255,0.6) inset',
          },
        },
        // Auth brand panel: faint grid overlay drifting diagonally.
        'grid-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '48px 48px' },
        },
        // Auth brand panel: the "247 teams online" status dot.
        'pulse-dot': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        // Landing hero: the floating product-board demo card.
        'float-card': {
          '0%, 100%': { transform: 'translateY(0) rotate(-1.2deg)' },
          '50%': { transform: 'translateY(-10px) rotate(-1.2deg)' },
        },
        // Landing hero: the small activity toast overlapping the board demo.
        'float-toast': {
          '0%, 100%': { transform: 'translateY(0) rotate(2.5deg)' },
          '50%': { transform: 'translateY(8px) rotate(2.5deg)' },
        },
        // Landing page: slow-drifting background aurora blobs.
        'aurora-1': {
          '0%, 100%': { transform: 'translate(-10%,-10%) scale(1)' },
          '50%': { transform: 'translate(8%,6%) scale(1.15)' },
        },
        'aurora-2': {
          '0%, 100%': { transform: 'translate(6%,4%) scale(1.1)' },
          '50%': { transform: 'translate(-8%,-8%) scale(1)' },
        },
        'aurora-3': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-6%,8%) scale(1.2)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.18s ease-out both',
        'dialog-in': 'dialog-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'command-in': 'command-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'card-glow': 'card-glow 6s ease-in-out infinite',
        'grid-drift': 'grid-drift 6s linear infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'float-card': 'float-card 7s ease-in-out infinite',
        'float-toast': 'float-toast 5s ease-in-out infinite',
        'aurora-1': 'aurora-1 26s ease-in-out infinite',
        'aurora-2': 'aurora-2 32s ease-in-out infinite',
        'aurora-3': 'aurora-3 38s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
