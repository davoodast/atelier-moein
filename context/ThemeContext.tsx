'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Thin wrapper kept for backward-compat with existing components that call useTheme()
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // next-themes ThemeProvider is already in layout.tsx; this just passes children through
  return <>{children}</>;
};

export const useTheme = (): ThemeContextType => {
  const { resolvedTheme, setTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  return { isDark, toggleTheme };
};
