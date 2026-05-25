import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        pulse: {
          ink: "#071018",
          panel: "#101923",
          cyan: "#00D1FF",
          lime: "#B6F34D",
          coral: "#FF5E57",
          amber: "#FFC247"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
