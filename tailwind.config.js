/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        persian: ['A-Iranian-Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#faf8f3',
        gold: '#d4af37',
        'deep-black': '#0a0a0a',
        'warm-gray': '#1a1a2e',
        'dark-purple': '#16213e',
        'purple-accent': '#6b4fb0',
        'light-purple': '#8b6bb0',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
