/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfbf7',
          100: '#fbf7ed',
          200: '#f4ebb6',
          300: '#eedf7e',
          400: '#e7d247',
          500: '#d4af37', // Brand Gold Primary
          600: '#aa771c', // Brand Gold Dark/Accent
          700: '#8c5e12',
          800: '#6d450b',
          900: '#4e2d06',
        },
        premium: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
