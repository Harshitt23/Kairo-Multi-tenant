import type { Transition, Variants } from 'framer-motion';

/**
 * Reusable framer-motion variants + transitions for the app.
 *
 * Design intent: calm, fast, tasteful — ~150–300ms, ease-out, never bouncy.
 * Use these instead of ad-hoc inline animations so every screen feels like one
 * system. Respect `prefers-reduced-motion` at the call site with the
 * `useReducedMotion()` hook (see `reducedMotionProps` below).
 */

/** Snappy ease-out curve used for most enters. */
export const ease: Transition['ease'] = [0.16, 1, 0.3, 1];

/** Gentle spring for hover/tap and layout changes — no visible overshoot. */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.7 };

/** Fade + rise. Default for cards, panels, list rows, page sections. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.15, ease } },
};

/** Subtle scale — good for dialogs, popovers, menus. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.18, ease } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.12, ease } },
};

/** Plain fade — overlays, backdrops, cross-fades. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease } },
  exit: { opacity: 0, transition: { duration: 0.12, ease } },
};

/**
 * Parent that staggers its children in. Pair with `staggerItem` on each child:
 *
 *   <motion.ul variants={staggerContainer} initial="hidden" animate="show">
 *     {rows.map((r) => <motion.li key={r.id} variants={staggerItem}>…</motion.li>)}
 *   </motion.ul>
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
  exit: {},
};

/** Child of `staggerContainer`. Shares the fadeInUp motion. */
export const staggerItem: Variants = fadeInUp;

/** Hover-lift for interactive cards. Spread onto a `motion.*` element. */
export const hoverLift = {
  whileHover: { y: -2, transition: spring },
  whileTap: { scale: 0.99, transition: spring },
} as const;

/**
 * Spread onto a `motion.*` element to disable movement for users who prefer
 * reduced motion, while keeping a plain opacity fade:
 *
 *   const reduce = useReducedMotion();
 *   <motion.div {...(reduce ? reducedMotionProps : {})} variants={fadeInUp} … />
 */
export const reducedMotionProps = {
  variants: fade,
  whileHover: undefined,
  whileTap: undefined,
} as const;
