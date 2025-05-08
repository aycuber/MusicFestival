/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7e22ce',
        'primary-light': '#a855f7',
        secondary: '#2dd4bf',
        accent: '#f97316',
        background: '#0f172a',
        surface: '#1e293b',
        'text-primary': '#f8fafc',
        'text-secondary': '#cbd5e1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}