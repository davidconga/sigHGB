/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hgb: {
          50: '#eaf1f8',
          100: '#cddff0',
          500: '#1f5fa6',
          600: '#194c85',
          700: '#143d6b',
          900: '#0a1f37',
        },
      },
    },
  },
  plugins: [],
}
