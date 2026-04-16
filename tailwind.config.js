/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#03050B",
          surface: "#070B14",
          card: "#0B1020",
          line: "#1E2A42",
          text: "#E5E7EB",
          muted: "#94A3B8",
          neon: "#8B5CF6",
          neonSoft: "#6D28D9",
          gold: "#22D3EE",
          silver: "#A78BFA",
          bronze: "#60A5FA",
          danger: "#E06B80"
        }
      },
      boxShadow: {
        neon: "0px 0px 22px rgba(139, 92, 246, 0.20)"
      }
    }
  },
  plugins: []
};
