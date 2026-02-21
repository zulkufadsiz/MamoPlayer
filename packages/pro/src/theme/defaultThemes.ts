import type { PlayerThemeConfig, ThemeName } from '../types/theme';

export const lightTheme: PlayerThemeConfig = {
  tokens: {
    colors: {
      background: '#FFFFFF',
      backgroundOverlay: '#FFFFFFCC',
      primary: '#2563EB',
      primaryText: '#111827',
      secondaryText: '#4B5563',
      accent: '#2563EB',
      danger: '#DC2626',
      border: '#E5E7EB',
      sliderTrack: '#6B7280',
      sliderThumb: '#2563EB',
    },
    typography: {
      fontFamily: 'System',
      fontSizeSmall: 12,
      fontSizeMedium: 14,
      fontSizeLarge: 20,
    },
    shape: {
      borderRadiusSmall: 8,
      borderRadiusMedium: 12,
      borderRadiusLarge: 18,
    },
  },
};

export const darkTheme: PlayerThemeConfig = {
  tokens: {
    colors: {
      background: '#0B0D10',
      backgroundOverlay: '#111827CC',
      primary: '#60A5FA',
      primaryText: '#F9FAFB',
      secondaryText: '#9CA3AF',
      accent: '#60A5FA',
      danger: '#EF4444',
      border: '#1F2937',
      sliderTrack: '#6B7280',
      sliderThumb: '#93C5FD',
    },
    typography: {
      fontFamily: 'System',
      fontSizeSmall: 12,
      fontSizeMedium: 14,
      fontSizeLarge: 20,
    },
    shape: {
      borderRadiusSmall: 8,
      borderRadiusMedium: 12,
      borderRadiusLarge: 18,
    },
  },
};

export const ottTheme: PlayerThemeConfig = {
  tokens: {
    colors: {
      background: '#0F1014',
      backgroundOverlay: '#18181BCC',
      primary: '#E50914',
      primaryText: '#F8FAFC',
      secondaryText: '#A1A1AA',
      accent: '#E50914',
      danger: '#F43F5E',
      border: '#27272A',
      sliderTrack: '#71717A',
      sliderThumb: '#E50914',
    },
    typography: {
      fontFamily: 'System',
      fontSizeSmall: 12,
      fontSizeMedium: 14,
      fontSizeLarge: 20,
    },
    shape: {
      borderRadiusSmall: 8,
      borderRadiusMedium: 12,
      borderRadiusLarge: 18,
    },
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