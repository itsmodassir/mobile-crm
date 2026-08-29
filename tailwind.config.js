/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc", // slate-50
        foreground: "#0f172a", // slate-900
        primary: {
          DEFAULT: "#2563eb", // blue-600
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9", // slate-100
          foreground: "#64748b", // slate-500
        },
        card: {
            DEFAULT: "#ffffff",
            foreground: "#0f172a",
        },
        border: "#e2e8f0", // slate-200
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
