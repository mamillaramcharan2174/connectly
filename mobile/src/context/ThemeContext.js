import React, { createContext, useContext, useState, useEffect } from 'react';
import { darkTheme, lightTheme } from '../theme';

const ThemeContext = createContext({
  theme: darkTheme,
  isDark: true,
  themePreference: 'dark',
  setThemePreference: () => {}
});

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState('dark');

  // Load persisted theme preference from storage if available
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('connectly_theme');
        if (saved) setThemePreferenceState(saved);
      }
    } catch (_) {}
  }, []);

  const setThemePreference = (pref) => {
    setThemePreferenceState(pref);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('connectly_theme', pref);
      }
    } catch (_) {}
  };

  const isDark = themePreference === 'dark' || (themePreference === 'system' && true);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
