import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg)",
        elevated: "var(--bg-elevated)",
        ink: "var(--text)",
        secondary: "var(--text-secondary)",
        muted: "var(--muted)",
        "muted-light": "var(--muted-light)",
        accent: "var(--accent)",
        "accent-dark": "var(--accent-dark)",
        "accent-light": "var(--accent-light)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        line: "var(--border)"
      },
      borderRadius: {
        pill: "980px",
        xl: "24px",
        lg: "18px",
        DEFAULT: "12px",
        sm: "8px"
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-lg": "var(--shadow-lg)",
        soft: "var(--shadow-sm)"
      },
      maxWidth: {
        layout: "1120px"
      }
    }
  },
  plugins: []
};

export default config;
