/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#4F6F52",
        primaryDark: "#3A5A40",
        secondary: "#D8E8D2",
        background: "#F8FAF5",
        text: "#1F2937",
        muted: "#64748B",
      },
    },
  },

  plugins: [],
}