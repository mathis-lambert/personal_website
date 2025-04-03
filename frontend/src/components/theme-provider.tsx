import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
);

const getSystemTheme = (): ResolvedTheme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialSelectedTheme =
      (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    return initialSelectedTheme === 'system'
      ? getSystemTheme()
      : initialSelectedTheme;
  });

  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const applyTheme = useCallback((selectedTheme: Theme) => {
    let currentResolvedTheme: ResolvedTheme;
    if (selectedTheme === 'system') {
      currentResolvedTheme = getSystemTheme();
    } else {
      currentResolvedTheme = selectedTheme;
    }

    const root = window.document.documentElement;
    const body = window.document.body;

    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    root.classList.add(currentResolvedTheme);
    body.classList.add(currentResolvedTheme); // Appliquer aussi au body

    setResolvedTheme(currentResolvedTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = () => {
      if (themeRef.current === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [applyTheme]); // Dépend seulement de applyTheme (stable)

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  // Appliquer le thème initial une fois après l'hydratation côté client
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter une seule fois au montage

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={{
        theme,
        resolvedTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
