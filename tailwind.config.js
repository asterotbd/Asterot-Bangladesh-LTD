/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#FF165A',
        accent: '#FF2D6D',
        surface: '#0B0B10',
        panel: '#13131A',
        darkGray: '#27272B',
        black: '#000000'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Noto Sans Bengali', 'sans-serif'],
        bn: ['Noto Sans Bengali', 'sans-serif']
      }
    }
  },
  plugins: []
}
