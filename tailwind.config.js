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
        primary: {
          DEFAULT: '#C9A45C', // Luxury Gold
          dark: '#B08C4A',
          light: '#DFBD79',
        },
        secondary: {
          DEFAULT: '#1E232A', // Deep Charcoal
          dark: '#111519',
        },
        background: {
          DEFAULT: '#FCFBF8', // Very light creamy white
          dark: '#121418', // Deep luxury dark
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#1E1E1E',
        },
        text: {
          main: '#1F2933',
          muted: '#7A827E',
          darkMain: '#E0E0E0',
          darkMuted: '#A0A0A0',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        quran: ['Amiri', 'serif'], // Fallback Quran font, can be Uthmani later
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}

