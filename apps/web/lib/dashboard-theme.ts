/**
 * Tweakable "depth & elevation" props for the Home dashboard, carried over
 * from the Dashboard.dc.html design component's `data-props` (elevation,
 * surfaceTint, cardBorders). Kept as a single config object — not baked
 * directly into markup — so it's easy to expose as a real user/workspace
 * preference later without re-deriving these values.
 */

export type DashboardElevation = 'flat' | 'subtle' | 'layered';

export interface DashboardThemeProps {
  elevation: DashboardElevation;
  surfaceTint: string;
  cardBorders: boolean;
}

// Matches the design component's declared defaults.
export const DEFAULT_DASHBOARD_THEME: DashboardThemeProps = {
  elevation: 'subtle',
  surfaceTint: '#f2f0fb',
  cardBorders: false,
};

interface ShadowSet {
  panel: string;
  panelHover: string;
  nested: string;
}

const SHADOW_SETS: Record<DashboardElevation, ShadowSet> = {
  flat: { panel: 'none', panelHover: 'none', nested: 'none' },
  subtle: {
    panel: '0 1px 2px rgba(16,24,40,0.04), 0 2px 8px -6px rgba(16,24,40,0.12)',
    panelHover: '0 2px 4px rgba(16,24,40,0.05), 0 8px 18px -10px rgba(16,24,40,0.16)',
    nested: '0 1px 2px rgba(16,24,40,0.04)',
  },
  layered: {
    panel: '0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -8px rgba(16,24,40,0.18)',
    panelHover: '0 2px 4px rgba(16,24,40,0.06), 0 12px 28px -10px rgba(16,24,40,0.22)',
    nested: '0 1px 2px rgba(16,24,40,0.05), 0 3px 10px -6px rgba(16,24,40,0.16)',
  },
};

export interface DashboardStyles {
  panelStyle: React.CSSProperties;
  panelHoverShadow: string;
  nestedStyle: React.CSSProperties;
  panelBorderClass: string;
  nestedBorderClass: string;
  surfaceTint: string;
}

/** Resolve the tweakable props into concrete inline styles + border classes. */
export function resolveDashboardTheme(props: DashboardThemeProps = DEFAULT_DASHBOARD_THEME): DashboardStyles {
  const sh = SHADOW_SETS[props.elevation];
  return {
    panelStyle: { boxShadow: sh.panel },
    panelHoverShadow: sh.panelHover,
    nestedStyle: { boxShadow: sh.nested },
    panelBorderClass: props.cardBorders ? 'border border-edge' : 'border border-transparent',
    nestedBorderClass: props.cardBorders
      ? 'border border-edge'
      : props.elevation === 'flat'
        ? 'border border-[#eef0f3]'
        : 'border border-transparent',
    surfaceTint: props.surfaceTint,
  };
}
