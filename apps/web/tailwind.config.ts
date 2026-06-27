import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        feu: {
          green: "#006b3f",
          gold: "#f4c430",
          ink: "#17211d"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(23, 33, 29, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

