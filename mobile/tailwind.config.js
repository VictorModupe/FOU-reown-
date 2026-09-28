/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        kenao: ['Kenao', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#4F2B50",
          light: "#8264A9",
          dark: "#351C36",
        },
        background: {
          DEFAULT: "rgb(var(--color-background) / <alpha-value>)",
          light: "rgb(var(--color-background-light) / <alpha-value>)",
          lighter: "rgb(var(--color-background-lighter) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          light: "rgb(var(--color-surface-light) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "#1DB954",
          red: "#F44336",
          yellow: "#FFC107",
        },
      },
    },
  },
  plugins: [],
};
