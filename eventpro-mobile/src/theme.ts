/**
 * Mobile theme aligned with web UI (eventpro-frontend index.css + tailwind.config).
 * Colors: Electric Midnight – primary violet/indigo (250 85% 55%), lavender gray background.
 * Fonts: Plus Jakarta Sans (sans), Syne (heading) – same as web; fallback to system if not loaded.
 */

const shared = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    full: 9999,
  },
  /** Optional: set when loading web fonts (Plus Jakarta Sans, Syne) via expo-font for full parity. */
  fontFamily: {
    sans: undefined as string | undefined,
    heading: undefined as string | undefined,
  },
  typography: {
    title: { fontSize: 24, fontWeight: "700" as const },
    heading: { fontSize: 20, fontWeight: "600" as const },
    body: { fontSize: 16 },
    caption: { fontSize: 14 },
    label: { fontSize: 14, fontWeight: "600" as const },
  },
};

export const lightColors = {
  primary: "#6366f1",
  primaryGlow: "#8b5cf6",
  primaryForeground: "#ffffff",
  background: "#faf9fc",
  foreground: "#1e1e2e",
  card: "#ffffff",
  cardForeground: "#1e1e2e",
  muted: "#f4f3f7",
  mutedForeground: "#71717a",
  border: "#e4e4e7",
  input: "#e4e4e7",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#22c55e",
  warning: "#eab308",
  accent: "#f59e0b",
  accentForeground: "#ffffff",
};

export const darkColors = {
  primary: "#818cf8",
  primaryGlow: "#a78bfa",
  primaryForeground: "#ffffff",
  background: "#1e1e2e",
  foreground: "#f4f4f5",
  card: "#27272a",
  cardForeground: "#f4f4f5",
  muted: "#3f3f46",
  mutedForeground: "#a1a1aa",
  border: "#3f3f46",
  input: "#3f3f46",
  destructive: "#f87171",
  destructiveForeground: "#ffffff",
  success: "#4ade80",
  warning: "#facc15",
  accent: "#fbbf24",
  accentForeground: "#1e1e2e",
};

export const lightTheme = { ...shared, colors: lightColors };
export const darkTheme = { ...shared, colors: darkColors };

export type Theme = typeof lightTheme;

/** Default export for backward compat; prefer useTheme() from ThemeContext for light/dark. */
export const theme = lightTheme;
