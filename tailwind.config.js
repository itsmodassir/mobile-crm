/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // zinc-950
        foreground: "#fafafa", // zinc-50
        primary: {
          DEFAULT: "#2563eb", // blue-600
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#27272a", // zinc-800
          foreground: "#a1a1aa", // zinc-400
        },
        card: {
            DEFAULT: "#18181b", // zinc-900
            foreground: "#fafafa",
        },
        border: "#27272a", // zinc-800
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
