/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        republican: '#B23A48',
        democratic: '#2F5C8A',
        other: '#8A7B5C',
        paper: '#F7F4EE',
        ink: '#1C1B1A',
      },
    },
  },
  plugins: [],
};
