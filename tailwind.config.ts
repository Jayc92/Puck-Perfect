import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        ice: "#9fe8ff",
        aurora: "#5ae3c0",
        ember: "#ff855f",
        steel: "#7c95b5",
        slate: "#132033",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(159, 232, 255, 0.2), 0 20px 60px rgba(7, 17, 31, 0.4)",
      },
      backgroundImage: {
        rink: "radial-gradient(circle at top, rgba(90, 227, 192, 0.16), transparent 42%), linear-gradient(145deg, rgba(7, 17, 31, 0.98), rgba(10, 23, 41, 0.92))",
      },
      fontFamily: {
        display: ['"Arial Narrow Bold"', '"Avenir Next Condensed"', '"Impact"', "sans-serif"],
        body: ['"Avenir Next"', '"Segoe UI"', '"Trebuchet MS"', "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        pulseSpin: {
          "0%": { transform: "scale(0.98)", opacity: "0.35" },
          "50%": { transform: "scale(1.02)", opacity: "1" },
          "100%": { transform: "scale(0.98)", opacity: "0.35" },
        },
        slideUp: {
          "0%": { transform: "translateY(18px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite alternate",
        pulseSpin: "pulseSpin 0.7s ease-in-out infinite",
        slideUp: "slideUp 0.35s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
