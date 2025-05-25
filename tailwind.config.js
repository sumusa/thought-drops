/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "calm-bg": "#F5F3F7",
        "calm-text": "#4A5568",
        "calm-subtext": "#718096",
        "calm-accent": "#66D9C0",
        "calm-card-bg": "#FFFFFF",
        "calm-border": "#D1D5DB",
        "dark-bg": "#111827",
        "dark-text-primary": "#D1D5DB",
        "dark-text-subtle": "#6B7280",
        "dark-surface": "#1F2937",
        "dark-border": "#374151",
        "dark-accent": "#22D3EE",
        "gradient-from-pink": "hsl(327, 90%, 54%)",
        "gradient-to-cyan": "hsl(188, 81%, 59%)",
        "primary": "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        "destructive": {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 