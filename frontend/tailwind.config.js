/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          50: '#fbf9f5',
          100: '#f5f0e6',
          200: '#eadecb',
          300: '#dec7a9',
          400: '#cdab83',
          500: '#b88d5e',
          600: '#9d714a',
          700: '#7d573b',
          800: '#644633',
          900: '#523a2c',
        },
        gold: {
          DEFAULT: '#b38728',
          light: '#d4af37',
          dark: '#916b1f',
          50: '#faf6ea',
          100: '#f4ebd0',
        },
        charcoal: {
          DEFAULT: '#1e293b',
          light: '#334155',
          dark: '#0f172a',
        },
        surface: {
          page: '#f8f9fa',
          card: '#ffffff',
          sidebar: '#0f172a',
          subtle: '#f1f5f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
