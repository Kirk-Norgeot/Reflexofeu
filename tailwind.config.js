/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#b3d7ff',
          200: '#80bdff',
          300: '#4da3ff',
          400: '#1a89ff',
          500: '#0070f3',
          600: '#0058c0',
          700: '#00408d',
          800: '#00285a',
          900: '#001027',
        },
        success: {
          50: '#e6f9f0',
          500: '#10b981',
          700: '#047857',
        },
        warning: {
          50: '#fff7ed',
          500: '#f97316',
          700: '#c2410c',
        },
      },
    },
  },
  plugins: [],
}
