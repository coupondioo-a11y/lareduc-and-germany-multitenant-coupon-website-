import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        hair: "var(--border)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          ink: "var(--primary-ink)",
        },
        sienna: "var(--sienna)",
        gold: "var(--gold)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        hero: {
          DEFAULT: "var(--hero)",
          deep: "var(--hero-deep)",
        },
        night: {
          DEFAULT: "var(--dark)",
          card: "var(--dark-card)",
          line: "var(--dark-line)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        shell: "78rem",
        prose: "42rem",
      },
      borderRadius: {
        card: "10px",
        panel: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.05)",
        lift: "0 8px 24px rgba(15,23,42,.10)",
      },
    },
  },
  plugins: [],
};

export default config;
