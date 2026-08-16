import type { Config } from "tailwindcss";

// Design system tokens per Docs/Design.md.
// Accent: PresenTap indigo. Neutrals: white / zinc-ish. Subtle borders, 12px
// card radius, soft shadows only.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        "background-subtle": "#FAFAFA",
        "background-muted": "#F4F4F5",
        foreground: "#18181B",
        "foreground-muted": "#52525B",
        "foreground-subtle": "#71717A",
        border: "#E4E4E7",
        "border-strong": "#D4D4D8",
        accent: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF2FF",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16A34A",
          soft: "#F0FDF4",
          border: "#BBF7D0",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEF2F2",
          border: "#FECACA",
        },
        warning: {
          DEFAULT: "#D97706",
          soft: "#FFFBEB",
          border: "#FDE68A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(24, 24, 27, 0.04), 0 1px 3px 0 rgba(24, 24, 27, 0.06)",
        "card-hover":
          "0 2px 4px 0 rgba(24, 24, 27, 0.06), 0 4px 12px 0 rgba(24, 24, 27, 0.06)",
      },
      maxWidth: {
        content: "72rem", // ~max-w-6xl per Design.md layout
      },
    },
  },
  plugins: [],
};

export default config;
