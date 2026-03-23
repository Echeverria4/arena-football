/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#050A11",
          surface: "#0A141B",
          card: "#0D1720",
          line: "#2B424B",
          text: "#FFFFFF",
          muted: "#F3F5F7",
          neon: "#9AE2B2",
          neonSoft: "#5D987C",
          gold: "#BFE9CC",
          silver: "#C9D7D8",
          bronze: "#739E8E",
          danger: "#E06B80"
        }
      },
      boxShadow: {
        neon: "0px 0px 22px rgba(154, 226, 178, 0.16)"
      }
    }
  },
  plugins: []
};
