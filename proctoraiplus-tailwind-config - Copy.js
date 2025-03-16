// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2a3f5d',
          light: '#4a7bdf',
          dark: '#1a2a40',
        },
        secondary: {
          DEFAULT: '#e6f0ff',
          light: '#f9f9fb',
          dark: '#c3d7ff',
        },
        success: '#27c93f',
        warning: '#ffbd2e',
        danger: '#ff5f56',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
