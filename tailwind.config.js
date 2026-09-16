/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Debe coincidir con src/constants/theme.ts
        primary: {
          DEFAULT: '#047857', // emerald-700
          dark: '#065f46', // emerald-800
        },
        danger: '#dc2626', // red-600
      },
    },
  },
  plugins: [],
};
