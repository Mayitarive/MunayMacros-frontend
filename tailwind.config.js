/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00CC99',
          dark: '#00A077',
          light: '#66E6C2',
        },
        secondary: {
          DEFAULT: '#FFEE88',
          dark: '#FFE855',
          light: '#FFF3AA',
        },
        success: {
          DEFAULT: '#97DB4F',
          dark: '#7BC427',
          light: '#B3E97A',
        },
        alert: {
          DEFAULT: '#DD1155',
          dark: '#BB0044',
          light: '#FF5599',
        },
        accent: {
          DEFAULT: '#FFA987',
          dark: '#FF8A60',
          light: '#FFC7B3',
        },
      },
    },
  },
  plugins: [],
};