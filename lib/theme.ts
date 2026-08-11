/**
 * سوق الجملة — Design token constants (spec §2 §3 §4 §5 §6 §9).
 *
 * Single source of truth for token *values* that need to be referenced
 * programmatically in TS/TSX (not every token is needed in JS — most are
 * consumed via Tailwind utility classes generated from @theme inline in
 * globals.css).
 *
 * These mirror the CSS custom properties defined in app/globals.css and
 * must be kept in sync.
 */

/* ── Color tokens (spec §2) ── */
export const colors = {
  // BASE
  bgBase: "#0f0f0f",
  bgSurface: "#1a1a1a",
  bgSurfaceAlt: "#1f1f1f",
  bgElevated: "#242424",
  borderDefault: "#2a2a2a",
  borderStrong: "#3a3a3a",

  // BRAND
  bgNav: "#1a3a2a",
  bgNavHover: "#234a35",
  brandGreen: "#1a7a3a",
  brandGreenLight: "#7ec96e",
  brandOrange: "#f5a623",
  brandOrangeHover: "#e0951a",
  waGreen: "#25d366",
  yellowWarning: "#f5c542",

  // SEMANTIC
  redError: "#e74c3c",
  greenSuccess: "#1a7a3a",
} as const;

/* Alpha / dim variants (rgba, kept as strings for inline use) */
export const colorAlpha = {
  brandGreenDim: "rgba(26,122,58,0.15)",
  brandOrangeDim: "rgba(245,166,35,0.15)",
  redErrorDim: "rgba(231,76,60,0.12)",
  waGreenDim: "rgba(37,211,102,0.15)",

  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.65)",
  textMuted: "rgba(255,255,255,0.40)",
  textDisabled: "rgba(255,255,255,0.25)",
} as const;

/* ── Spacing scale (spec §4) — rem values matching the 8px grid ── */
export const spacing = {
  1: "0.25rem", /* 4px  */
  2: "0.5rem",  /* 8px  */
  3: "0.75rem", /* 12px */
  4: "1rem",    /* 16px */
  5: "1.25rem", /* 20px */
  6: "1.5rem",  /* 24px */
  7: "2rem",    /* 32px */
  8: "2.5rem",  /* 40px */
  9: "3rem",    /* 48px */
  10: "4rem",   /* 64px */
} as const;

/* ── Border radius (spec §5) ── */
export const radius = {
  sm: "0.25rem",   /* 4px  — badges, chips   */
  md: "0.5rem",    /* 8px  — buttons, inputs */
  lg: "0.75rem",   /* 12px — cards           */
  xl: "1rem",      /* 16px — modals, sheets  */
  full: "999px",   /* pills, circles         */
} as const;

/* ── Shadows (spec §6, tuned for near-black) ── */
export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  md: "0 4px 12px rgba(0,0,0,0.5)",
  lg: "0 8px 24px rgba(0,0,0,0.6)",
  wa: "0 4px 12px rgba(37,211,102,0.4)",
  focus: "0 0 0 3px rgba(26,122,58,0.4)",
} as const;

/* ── Typography (spec §3) ── */
export const typography = {
  displayLg: { size: "2rem", weight: 900, leading: 1.2 },       /* 32px */
  displaySm: { size: "1.5rem", weight: 800, leading: 1.3 },      /* 24px */
  headingLg: { size: "1.125rem", weight: 700, leading: 1.4 },   /* 18px */
  headingSm: { size: "0.9375rem", weight: 700, leading: 1.4 },   /* 15px */
  bodyLg: { size: "0.875rem", weight: 400, leading: 1.6 },      /* 14px */
  bodySm: { size: "0.8125rem", weight: 400, leading: 1.5 },      /* 13px */
  caption: { size: "0.75rem", weight: 400, leading: 1.4 },       /* 12px */
  micro: { size: "0.6875rem", weight: 400, leading: 1.3 },        /* 11px */
  badgeText: { size: "0.625rem", weight: 700, leading: 1 },       /* 10px */
  priceLg: { size: "2rem", weight: 800, leading: 1 },            /* 32px */
  priceMd: { size: "1.125rem", weight: 700, leading: 1 },         /* 18px */
  priceSm: { size: "0.875rem", weight: 600, leading: 1 },         /* 14px */
} as const;

/* ── Elevation (spec §6) — applied alongside border-strong on dark ── */
export const elevatedStyle = {
  background: colors.bgElevated,
  border: `1px solid ${colors.borderStrong}`,
  boxShadow: shadows.lg,
} as const;
