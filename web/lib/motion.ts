/**
 * Shared Framer Motion vocabulary for dashboard/shell widgets. Existing
 * components with their own inline motion values are left as-is — this is
 * for new widgets going forward, so they inherit one consistent feel
 * instead of each picking its own duration/easing/stagger.
 */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const STAGGER_STEP = 0.03;

export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.base, ease: EASE_OUT },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DURATION.base, ease: EASE_OUT },
};

/** For list items: `initial`/`animate` stay fixed, only the delay scales
 * with index — call this per-item so lists cascade in on mount. */
export function staggerItem(index: number) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.base, ease: EASE_OUT, delay: index * STAGGER_STEP },
  };
}
