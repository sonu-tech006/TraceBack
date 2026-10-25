import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccentColor = 'indigo' | 'emerald' | 'teal' | 'amber' | 'rose' | 'violet';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ACCENT_PALETTE: { id: AccentColor; label: string; previewClass: string }[] = [
  { id: 'indigo', label: 'Indigo Core', previewClass: 'bg-indigo-600' },
  { id: 'teal', label: 'Nordic Teal', previewClass: 'bg-teal-600' },
  { id: 'emerald', label: 'Campus Emerald', previewClass: 'bg-emerald-600' },
  { id: 'amber', label: 'Warm Amber', previewClass: 'bg-amber-600' },
  { id: 'rose', label: 'Berry Rose', previewClass: 'bg-rose-600' },
  { id: 'violet', label: 'Electric Violet', previewClass: 'bg-violet-600' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('traceback_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem('traceback_accent') as AccentColor) || 'indigo';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('traceback_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('traceback_accent', accent);
  }, [accent]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setAccent = (c: AccentColor) => setAccentState(c);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
