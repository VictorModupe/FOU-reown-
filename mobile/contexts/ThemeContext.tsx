import * as SecureStore from "expo-secure-store";
import { Appearance, ColorSchemeName } from "react-native";
import { createContext, useContext, useEffect, useState } from "react";
import { vars } from "nativewind";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  themeVariables: ReturnType<typeof vars>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = Appearance.getColorScheme() === "light" ? "light" : "dark";
  const [theme, setTheme] = useState<ThemeMode>(systemTheme);

  useEffect(() => {
    SecureStore.getItemAsync("theme-mode").then((savedTheme) => {
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    });
  }, []);

  const updateTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    Appearance.setColorScheme(nextTheme as ColorSchemeName);
    SecureStore.setItemAsync("theme-mode", nextTheme);
  };

  const themeVariables = vars(
    theme === "dark"
      ? {
          "--color-background": "18 18 18",
          "--color-background-light": "24 24 24",
          "--color-background-lighter": "40 40 40",
          "--color-surface": "40 40 40",
          "--color-surface-light": "62 62 62",
          "--color-text-primary": "255 255 255",
          "--color-text-secondary": "179 179 179",
          "--color-text-tertiary": "106 106 106",
        }
      : {
          "--color-background": "239 233 243",
          "--color-background-light": "251 248 253",
          "--color-background-lighter": "229 220 236",
          "--color-surface": "255 254 255",
          "--color-surface-light": "219 208 227",
          "--color-text-primary": "42 30 45",
          "--color-text-secondary": "93 79 101",
          "--color-text-tertiary": "101 89 108",
        }
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme: () => updateTheme(theme === "dark" ? "light" : "dark"),
        themeVariables,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}