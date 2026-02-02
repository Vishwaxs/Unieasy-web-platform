import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import lightFaviconHref from "@/assets/Web-Tab-Logo.png";
import darkFaviconHref from "@/assets/Web-Dark-Tab-Logo.png";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

    // Update favicon dynamically for the current theme.
    const href = theme === "dark" ? darkFaviconHref : lightFaviconHref;
    const existing =
      document.querySelector<HTMLLinkElement>('link[data-unieasy="favicon"]') ||
      document.getElementById("app-favicon");

    const linkEl = (existing as HTMLLinkElement | null) ?? document.createElement("link");
    linkEl.setAttribute("data-unieasy", "favicon");
    linkEl.rel = "icon";
    linkEl.type = "image/png";
    linkEl.href = href;
    if (!linkEl.parentNode) {
      document.head.appendChild(linkEl);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
