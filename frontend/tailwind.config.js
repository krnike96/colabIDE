/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "IDE Dark" theme colors
        editor: '#1e1e1e',
        sidebar: '#252526',
        activity: '#333333',
        accent: '#007acc'
      }
    },
  },
  plugins: [],
}