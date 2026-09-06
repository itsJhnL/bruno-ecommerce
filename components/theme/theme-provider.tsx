"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { THEME_STORAGE_KEY } from "./theme-script";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** What the visitor chose. Defaults to "dark" — see Memory.md D-016. */
  theme: ThemeChoice;
  /** What that resolves to right now. "system" follows the OS live. */
  resolved: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
  /** False until the client has read localStorage. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT: ThemeChoice = "dark";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(DEFAULT);
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [ready, setReady] = useState(false);

  // Read the stored preference once. The inline script already applied it to
  // the DOM before paint; this only syncs React's copy of the truth.
  useEffect(() => {
    let stored: ThemeChoice = DEFAULT;
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      // Private mode, or storage disabled. Fall back to the default.
    }
    const next = stored === "system" ? systemTheme() : stored;
    setThemeState(stored);
    setResolved(next);
    apply(next);
    setReady(true);
  }, []);

  // Follow the OS live, but only while the choice is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const next = systemTheme();
      setResolved(next);
      apply(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    const target = next === "system" ? systemTheme() : next;
    setResolved(target);
    apply(target);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Nothing to do — the choice still applies for this session.
    }
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, ready }),
    [theme, resolved, setTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
