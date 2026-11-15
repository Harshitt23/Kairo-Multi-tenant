/**
 * Elevation config for the Home dashboard. The dense redesign is flat and
 * bordered — depth comes from hairlines, not shadows or tints. Kept as a
 * config object so it could still become a user preference later.
 */

export type DashboardElevation = 'flat' | 'subtle' | 'layered';

export interface DashboardThemeProps {
  elevation: DashboardElevation;
  surfaceTint: string;
  cardBorders: boolean;
}

export const DEFAULT_DASHBOARD_THEME: DashboardThemeProps = {
  elevation: 'flat',
  surfaceTint: 'rgb(var(--elevated) / 0.5)',
  cardBorders: true,
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
export function resolveDashboardTheme(
  props: DashboardThemeProps = DEFAULT_DASHBOARD_THEME,
): DashboardStyles {
  return {
    panelStyle: {},
    panelHoverShadow: 'none',
    nestedStyle: {},
    panelBorderClass: props.cardBorders ? 'border border-edge' : 'border border-transparent',
    nestedBorderClass: 'border border-edge',
    surfaceTint: props.surfaceTint,
  };
}
