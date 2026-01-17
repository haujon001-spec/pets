/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FFEDD5', // warm light
          DEFAULT: '#F59E42', // warm orange
          dark: '#B45309', // deep warm
        },
        accent: {
          light: '#FDE68A',
          DEFAULT: '#FBBF24',
          dark: '#B45309',
        },
        background: '#FFF8F1',
        card: '#FFE4C7',
        text: '#7C4700',
      },
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
}
