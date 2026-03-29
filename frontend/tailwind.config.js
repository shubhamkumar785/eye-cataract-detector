/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#4f46e5",
        normal: "#16a34a",
        mild: "#d97706",
        severe: "#dc2626",
      },
      fontFamily: {
        body: ["Aptos", "Segoe UI", "sans-serif"],
        display: ["Trebuchet MS", "Aptos", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.10)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(79,70,229,0.22), transparent 35%), radial-gradient(circle at 85% 15%, rgba(13,148,136,0.18), transparent 30%), linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(241,245,249,0.98) 100%)",
      },
    },
  },
  plugins: [],
};
