// contexts/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

const THEME_STORAGE_KEY = 'theme';
const LEGACY_DARK_MODE_KEY = 'darkMode';

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;

  const legacyDarkMode = localStorage.getItem(LEGACY_DARK_MODE_KEY);
  if (legacyDarkMode === 'true') return 'dark';
  if (legacyDarkMode === 'false') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
};

const ThemeContext = createContext({
  theme: 'light',
  darkMode: false,
  setTheme: () => {},
  toggleDarkMode: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getPreferredTheme);
  const darkMode = theme === 'dark';

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(LEGACY_DARK_MODE_KEY, String(theme === 'dark'));
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (event) => {
      const hasSavedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const hasLegacyTheme = localStorage.getItem(LEGACY_DARK_MODE_KEY);

      if (!hasSavedTheme && hasLegacyTheme === null) {
        setThemeState(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const setTheme = (nextTheme, showToast = false) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    setThemeState(normalizedTheme);

    if (showToast) {
      toast.success(normalizedTheme === 'dark' ? 'Modo escuro ativado' : 'Modo claro ativado');
    }
  };

  const toggleDarkMode = () => {
    setTheme(darkMode ? 'light' : 'dark', true);
  };

  return (
    <ThemeContext.Provider value={{ theme, darkMode, setTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
