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
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'ice-blue': '#dbeafe',
        'ice-red':  '#fecdd3',
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        card:   '0 4px 24px rgba(37, 99, 235, 0.08)',
        glow:   '0 8px 24px -4px rgba(37, 99, 235, 0.35)',
        'glow-red': '0 8px 24px -4px rgba(244, 63, 94, 0.30)',
      },
      backgroundImage: {
        'page-gradient':
          'linear-gradient(135deg, #dbeafe 0%, #eff6ff 22%, #f8fafc 50%, #fff1f2 78%, #fecdd3 100%)',
      },
    },
  },
  plugins: [],
}
