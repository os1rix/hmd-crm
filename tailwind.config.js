/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        white: "#ffffff",
        lime: "#e4ff00",
        antracite: "#242426",
        "dirty-white": "#fafafa",
        "low-gray": "#5e5e5e",
        disabled: "#433e40",
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: "var(--sidebar)",
        accent: "var(--accent)",
        "accent-muted": "var(--accent-muted)",
        "accent-foreground": "var(--accent-foreground)",
        warning: "var(--warning)",
        success: "var(--success)",
        danger: "var(--danger)",
        border: "var(--border)",
        card: "var(--card)",
        "card-border": "var(--card-border)",
        "card-hover": "var(--card-hover)",
        muted: "var(--muted)",
        section: "var(--section)",
        surface: "var(--surface)",
      },
      width: {
        sidebar: "220px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
