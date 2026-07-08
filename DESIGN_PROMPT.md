# Frontend Redesign Prompt — paste into Claude

> How to use: Send **Section A** first (design system). When Claude returns the tokens + primitives,
> paste them into your repo, then send **Section B** prompts one at a time (board, shell, login, …),
> each with the current file attached. The current code for the hardest pieces is embedded below so
> Claude redesigns *your* app, not a generic one.

---

## PROJECT CONTEXT (include at the top of every message)

I'm redesigning the frontend of **PM SaaS**, a multi-tenant project-management app (a Linear/Jira-lite):
workspaces → projects → issues, RBAC, a real-time drag-and-drop board with live presence, a
notifications inbox, org settings, and Stripe billing.

**This is a real, running app — not a mockup.** Your output must drop into the existing files.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · React Query · dnd-kit · socket.io-client ·
Radix UI · class-variance-authority (cva). The `cn()` helper is `clsx + tailwind-merge`.

**Existing structure (do not rename or move):**
```
app/login/page.tsx
app/[orgSlug]/page.tsx                      org dashboard
app/[orgSlug]/[projectKey]/board/page.tsx   the board
app/[orgSlug]/inbox/page.tsx                notifications
app/[orgSlug]/settings/page.tsx             org settings
components/  app-bar, board, brand(Avatar), command-palette, sidebar,
             issue-modal, notifications-menu, org-settings, create-*-dialog
components/ui/  button, input, field, badge, dialog, dropdown-menu,
                empty-state, error-state, skeleton, spinner
lib/  api.ts, hooks.ts (React Query), socket.ts, use-board-realtime.ts, cn.ts
```

### HARD CONSTRAINTS (repeat these in every prompt)
1. **Keep the same file paths and the same exported names + prop signatures.** I'm swapping internals only.
2. **Do NOT touch anything in `lib/*`** (data fetching, sockets, ranking) or any handler logic. Presentation only.
3. Tailwind utility classes only — no CSS-in-JS, no new global CSS unless I ask.
4. Accessible: visible focus rings, keyboard support, `aria-*` preserved, honor `prefers-reduced-motion`.
5. Return **each file in full**, ready to paste. No ellipses.

### DESIGN DIRECTION
- **Light / day theme.** Clean and airy, generous whitespace, soft shadows, subtle depth — Linear /
  Height / Vercel-dashboard polish. Calm and fast, never flashy.
- Keep the brand accent: indigo→violet `linear-gradient(135deg,#6366f1,#8b5cf6)`.
- **Animation with `framer-motion`** (I'll install it): fade/slide on mount, gentle spring on hover,
  animated layout (`layout` prop) on list reorder, smooth column/card transitions. Tasteful, ~150–300ms,
  ease-out — never bouncy or gimmicky.

---

## SECTION A — Pass 1: design system (send this first)

> [Paste PROJECT CONTEXT + HARD CONSTRAINTS + DESIGN DIRECTION above, then:]

Redesign **only the design system** for a light theme. Deliverables:

1. A new `tailwind.config.ts` `theme.extend` block — light `colors` (page bg, card/panel surfaces,
   borders, muted + strong text, brand), `boxShadow`, `keyframes`, `animation`. Replace my dark tokens
   (`surface/panel/elevated/edge`) with light equivalents but **keep the same token names** so existing
   `bg-panel` / `border-edge` classes across the app keep working.
2. A new `app/globals.css` (light `color-scheme`, body colors, focus ring, light scrollbars).
3. Redesigned primitives, same paths + same exported props:
   `components/ui/button.tsx`, `input.tsx`, `field.tsx`, `badge.tsx`, `dialog.tsx`,
   `dropdown-menu.tsx`, `empty-state.tsx`, `skeleton.tsx`, `spinner.tsx`.
4. **Do NOT create `lib/motion.ts`** — it already exists (shown below). Reuse its exported variants
   (`fadeInUp`, `scaleIn`, `fade`, `staggerContainer`, `staggerItem`, `hoverLift`, `spring`,
   `reducedMotionProps`, `ease`) throughout your primitives. If you genuinely need a new variant,
   add it to this same file and return the full updated file — do not fork a second one.

Here is my **current** config and two representative primitives so you match my conventions exactly:

### current `tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0b0c10',
        panel: '#141519',
        elevated: '#1a1c22',
        edge: '#23262e',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      backgroundImage: { brand: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.35), 0 10px 30px -18px rgba(0,0,0,0.7)',
        glow: '0 6px 20px -6px rgba(99,102,241,0.55)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'dialog-in': { '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.97)' }, '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' } },
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
```

### current `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
body { @apply bg-surface text-zinc-100 antialiased; min-height: 100vh; }

@layer base {
  *:focus-visible { outline: none; @apply ring-2 ring-indigo-500/60 ring-offset-0; }
  ::selection { background: rgba(99, 102, 241, 0.35); }
}
@layer utilities {
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2e37; border-radius: 9999px; border: 2px solid transparent; background-clip: content-box; }
  ::-webkit-scrollbar-thumb:hover { background: #3a3f4b; background-clip: content-box; }
}
```

### current `components/ui/button.tsx` (keep this exact API: variants primary|secondary|ghost|outline|danger, sizes sm|md|lg|icon, `loading` prop)
```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white shadow-glow hover:opacity-90',
        secondary: 'border border-edge bg-elevated text-zinc-200 hover:border-zinc-600',
        ghost: 'text-zinc-400 hover:bg-elevated hover:text-zinc-200',
        outline: 'border border-edge text-zinc-300 hover:border-indigo-500/50 hover:text-zinc-100',
        danger: 'bg-red-600/90 text-white hover:bg-red-600',
      },
      size: { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-sm', icon: 'h-8 w-8' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
```

### current `components/ui/dialog.tsx` (Radix-based; keep DialogContent's `title/description/wide` props)
```tsx
'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ title, description, children, className, wide = false }: {
  title: string; description?: string; children: ReactNode; className?: string; wide?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge bg-panel p-6 shadow-card focus:outline-none data-[state=open]:animate-dialog-in', wide ? 'max-w-2xl' : 'max-w-md', className)}>
        {/* header with title/description + close button, then children */}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

### existing `lib/motion.ts` — ALREADY IN THE REPO, reuse these; do not create a second motion file
```ts
import type { Transition, Variants } from 'framer-motion';

export const ease: Transition['ease'] = [0.16, 1, 0.3, 1];
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.7 };

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.15, ease } },
};
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.18, ease } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.12, ease } },
};
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease } },
  exit: { opacity: 0, transition: { duration: 0.12, ease } },
};
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
  exit: {},
};
export const staggerItem: Variants = fadeInUp;
export const hoverLift = {
  whileHover: { y: -2, transition: spring },
  whileTap: { scale: 0.99, transition: spring },
} as const;
export const reducedMotionProps = { variants: fade, whileHover: undefined, whileTap: undefined } as const;
```

Now produce the full light-theme versions of all files listed in the deliverables. `framer-motion@^12`
is already installed and `lib/motion.ts` already exists — import from it, don't recreate it.

---

## SECTION B — Pass 2: screens (send one per message, after Pass 1 is merged)

Prefix each with the PROJECT CONTEXT + HARD CONSTRAINTS + DESIGN DIRECTION, attach the current file,
and use the matching brief:

### B1. Board — `components/board.tsx`
Redesign this Kanban board for the light theme. Requirements:
- Animate columns/cards on mount (staggered fade-up) and use framer-motion `layout` so cards glide
  when reordered/filtered. Gentle hover-lift on cards; clear drop-target highlight per column.
- **Keep every dnd-kit hook, the `useBoardRealtime` presence wiring, `useMoveIssue`, filters, the
  `?issue=` deep-link, and the `c`/`/` keyboard shortcuts exactly as-is.** Presentation only.
- Polished presence avatars, animated per-column count badges, refined toolbar (search + filters).
The full current file is attached below — return it fully redesigned.

<attach the current components/board.tsx — it's in your repo>

### B2. App shell — `components/sidebar.tsx` + `components/app-bar.tsx`
Collapsible sidebar with an org switcher and nav (Board / Inbox / Settings); active route gets an
animated highlight that slides between items. Top bar with breadcrumb, command-palette trigger (⌘K),
and the notifications menu. Same routes and props.

### B3. Login — `app/login/page.tsx`
A beautiful light split-screen auth page: form on one side, a subtle animated indigo→violet gradient
panel with product tagline on the other. Keep the existing submit handler, field names, and error UI.

### B4. Inbox — `app/[orgSlug]/inbox/page.tsx` + `components/notifications-menu.tsx`
Clean notification list with unread emphasis, grouping, and smooth enter/leave animations. Keep hooks.

### B5. Org dashboard — `app/[orgSlug]/page.tsx`
A welcoming landing: project cards with hover motion, quick stats, empty states. Keep data hooks.

### B6. Settings — `app/[orgSlug]/settings/page.tsx` + `components/org-settings.tsx`
Tabbed/segmented settings (members + roles table, billing). Keep the RBAC and billing logic.

### B7. Dialogs & command palette — `components/issue-modal.tsx`, `create-*-dialog.tsx`, `command-palette.tsx`
Refined light dialogs (built on the new `DialogContent`), animated command palette with fuzzy results
and keyboard nav. Keep all handlers.

---

## AFTER YOU GET THE CODE — integration checklist
1. `pnpm --filter @pm/web add framer-motion`
2. Paste files back at the **same paths**. Start with Section A, verify, then do B1…B7 one at a time.
3. `pnpm --filter @pm/web dev` (or `pnpm dev`) and eyeball each screen before moving on.
4. `pnpm --filter @pm/web typecheck` to catch prop mismatches early.
5. If a screen looks off, send Claude a screenshot + "tighten spacing/contrast here" — iterate visually.
