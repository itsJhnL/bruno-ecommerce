/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f1eb",
          100: "#ebe1d4",
          200: "#d9c2a6",
          300: "#c39d77",
          400: "#b17d54",
          500: "#9a6742",
          600: "#805239",
          700: "#65402f",
          800: "#45302a",
          900: "#241d1b"
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        sans: ['"Plus Jakarta Sans"', "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(36, 29, 27, 0.10)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(154, 103, 66, 0.22), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,239,233,0.78))"
      }
    }
  },
  plugins: []
};
