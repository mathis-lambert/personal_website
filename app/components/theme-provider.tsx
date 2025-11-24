"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

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
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredTheme = (storageKey: string, fallback: Theme): Theme => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage?.getItem?.(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore storage access errors (e.g., disabled cookies/storage)
  }
  return fallback;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "next-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme),
  );

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme(storageKey, defaultTheme);
    return initialTheme === "system" ? getSystemTheme() : initialTheme;
  });

  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const applyTheme = useCallback((selectedTheme: Theme) => {
    if (typeof window === "undefined") return;

    const currentResolvedTheme =
      selectedTheme === "system" ? getSystemTheme() : selectedTheme;

    const root = window.document.documentElement;
    const body = window.document.body;

    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    root.classList.add(currentResolvedTheme);
    body.classList.add(currentResolvedTheme);
    root.style.colorScheme = currentResolvedTheme;

    setResolvedTheme(currentResolvedTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const storedTheme = getStoredTheme(storageKey, defaultTheme);
    if (storedTheme !== theme) {
      setThemeState(storedTheme);
      applyTheme(storedTheme);
    }
  }, [storageKey, defaultTheme, theme, applyTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      if (themeRef.current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [applyTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem?.(storageKey, newTheme);
      }
    } catch {
      // Ignore storage write errors
    }
    setThemeState(newTheme);
  };

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

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
