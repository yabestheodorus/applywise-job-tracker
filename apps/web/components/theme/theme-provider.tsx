'use client';

import * as React from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** The user's selection: 'light' | 'dark' | 'system'. */
  theme: Theme;
  /** The theme actually applied to the DOM: 'light' | 'dark'. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

/** Matches next-themes' default so existing preferences carry over. */
export const STORAGE_KEY = 'theme';

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

/** Temporarily kill CSS transitions so theme switches don't animate. */
function disableTransitions(): () => void {
  const style = document.createElement('style');
  style.appendChild(
    document.createTextNode('*,*::before,*::after{transition:none !important}'),
  );
  document.head.appendChild(style);
  return () => {
    // Force a reflow to flush the class change before transitions return.
    window.getComputedStyle(document.body);
    setTimeout(() => document.head.removeChild(style), 1);
  };
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>('light');

  const apply = React.useCallback(
    (next: Theme) => {
      const resolved = resolve(next);
      const restore = disableTransitionOnChange
        ? disableTransitions()
        : undefined;
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      root.style.colorScheme = resolved;
      setResolvedTheme(resolved);
      restore?.();
    },
    [disableTransitionOnChange],
  );

  // Hydrate from storage on mount. The inline <ThemeScript> already painted the
  // correct theme before hydration; here we sync React state to it.
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored ?? defaultTheme;
    setThemeState(initial);
    setResolvedTheme(resolve(initial));
  }, [defaultTheme]);

  // Follow OS preference changes while the selection is 'system'.
  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) ?? defaultTheme) === 'system') {
        apply('system');
      }
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [apply, defaultTheme]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      localStorage.setItem(STORAGE_KEY, next);
      setThemeState(next);
      apply(next);
    },
    [apply],
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
