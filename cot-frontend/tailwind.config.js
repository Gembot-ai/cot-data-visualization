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
        // Eccuity brand colors
        'eccuity-coral': '#FF5748',
        'eccuity-purple': {
          300: '#352351',
          200: '#6845A1',
          100: '#5D4F74',
        },
        'eccuity-light': {
          100: '#F9F7F6',
          200: '#F3EEED',
          300: '#E7DCDA',
          400: '#B9ADB4',
        },
        'eccuity-dark': {
          100: '#3F3F42',
          200: '#2C2C2F',
          300: '#202021',
          400: '#1a1a1a',
        },
        'eccuity-beige': {
          DEFAULT: '#F8F5F0',
          light: '#FED7AA',
        },
        // Legacy brand colors (keeping for backwards compatibility)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#FF5748',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Libre Franklin', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'gem': '0px 1px 3px 0px #0000001A',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
