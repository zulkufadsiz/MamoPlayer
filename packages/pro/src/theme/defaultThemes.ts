import type { PlayerThemeConfig, ThemeName } from '../types/theme';

export const lightTheme: PlayerThemeConfig = {
  colors: {
    background: "#FFFFFF",
    surface: "#F7F8FA",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    accent: "#2563EB",
    accentContrast: "#FFFFFF",
    border: "#E5E7EB",
    controlBackground: "#FFFFFFCC",
    controlActive: "#2563EB",
    controlInactive: "#6B7280",
  },
  typography: {
    fontFamily: "System",
    titleSize: 20,
    bodySize: 14,
    captionSize: 12,
    weightRegular: "400",
    weightMedium: "500",
    weightBold: "700",
  },
  shape: {
    radiusSm: 8,
    radiusMd: 12,
    radiusLg: 18,
    controlPill: 999,
  },
};

export const darkTheme: PlayerThemeConfig = {
  colors: {
    background: "#0B0D10",
    surface: "#141821",
    textPrimary: "#F9FAFB",
    textSecondary: "#9CA3AF",
    accent: "#60A5FA",
    accentContrast: "#0B0D10",
    border: "#1F2937",
    controlBackground: "#111827CC",
    controlActive: "#93C5FD",
    controlInactive: "#6B7280",
  },
  typography: {
    fontFamily: "System",
    titleSize: 20,
    bodySize: 14,
    captionSize: 12,
    weightRegular: "400",
    weightMedium: "500",
    weightBold: "700",
  },
  shape: {
    radiusSm: 8,
    radiusMd: 12,
    radiusLg: 18,
    controlPill: 999,
  },
};

export const ottTheme: PlayerThemeConfig = {
  colors: {
    background: "#0F1014",
    surface: "#171923",
    textPrimary: "#F8FAFC",
    textSecondary: "#A1A1AA",
    accent: "#E50914",
    accentContrast: "#FFFFFF",
    border: "#27272A",
    controlBackground: "#18181BCC",
    controlActive: "#E50914",
    controlInactive: "#71717A",
  },
  typography: {
    fontFamily: "System",
    titleSize: 20,
    bodySize: 14,
    captionSize: 12,
    weightRegular: "400",
    weightMedium: "500",
    weightBold: "700",
  },
  shape: {
    radiusSm: 8,
    radiusMd: 12,
    radiusLg: 18,
    controlPill: 999,
  },
};

export const defaultThemes: Record<ThemeName, PlayerThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  ott: ottTheme,
};

export const getDefaultTheme = (name: ThemeName): PlayerThemeConfig => {
  return defaultThemes[name] ?? lightTheme;
};