/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        term: {
          bg: "#0b0e14", // Deep black/blue background
          panel: "#12161f", // Slightly lighter panel background
          border: "#2c323e", // Gray borders
          text: "#a5b2c5", // Off-white text
          cyan: "#00bfff", // Cyan headers (cpu, mem, net)
          yellow: "#fce94f", // Yellow CPU/Data highlights
          green: "#8ae234", // Green Memory/Good stats
          purple: "#ad7fa8", // Purple Network/GPU
          red: "#ef2929", // Red (if needed for high loads)
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
