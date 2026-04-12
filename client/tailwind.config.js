/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      colors: {
        paper: "#fffdf8",
        ink: "#1c1917",
        muted: "#57534e",
        accent: "#9f1239",
        accentsoft: "#fce7f3",
      },
    },
  },
  plugins: [],
};
