/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: "var(--sidebar)",
        accent: "var(--accent)",
        "accent-muted": "var(--accent-muted)",
        warning: "var(--warning)",
        success: "var(--success)",
        danger: "var(--danger)",
        teal: "var(--teal)",
        border: "var(--border)",
        card: "var(--card)",
        muted: "var(--muted)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
