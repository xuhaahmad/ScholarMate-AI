/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
colors: {
  primary: "#486A5A",
  primaryDark: "#355145",

  secondary: "#E4F0E7",

  background: "#F7F8F5",

  surface: "#FFFFFF",

  text: "#1F2933",

  muted: "#667085",

  border: "#DDE7DF",

  accent: "#8FB996",
},
    },
  },

  plugins: [],
}