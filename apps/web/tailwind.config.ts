import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "riq-black": "#08090B",
        "riq-graphite": "#12151A",
        "riq-panel": "#1A1E24",
        "riq-red": "#FF2B2B",
        "riq-orange": "#FF6B00",
        "riq-cyan": "#30D5FF",
        "riq-white": "#F4F6F8",
        "riq-gray": "#8C949F",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1',
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
