import React, { createContext, useContext, useMemo } from 'react';
import type { PlayerThemeConfig, ThemeName } from '../types/theme';
import { darkTheme, defaultThemes } from './defaultThemes';

interface ThemeProviderProps {
  theme?: PlayerThemeConfig;
  themeName?: ThemeName;
  children: React.ReactNode;
}

const ThemeContext = createContext<PlayerThemeConfig>(darkTheme);

const resolveTheme = ({ theme, themeName }: Pick<ThemeProviderProps, 'theme' | 'themeName'>) => {
  if (theme) {
    return theme;
  }

  if (themeName) {
    return defaultThemes[themeName] ?? darkTheme;
  }

  return darkTheme;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, themeName, children }) => {
  const value = useMemo(() => resolveTheme({ theme, themeName }), [theme, themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const usePlayerTheme = (): PlayerThemeConfig => {
  return useContext(ThemeContext);
};
