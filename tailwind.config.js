/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        "accent-muted": "var(--accent-muted)",
        border: "var(--border)",
        card: "var(--card)",
        muted: "var(--muted)",
      },
    },
  },
  plugins: [],
};
