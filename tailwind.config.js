/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8F4",
        ink: "#24332B",
        forest: "#294B3A",
        leaf: "#52765C",
        mint: "#E8EFE5",
        muted: "#879188",
        line: "#E8EBE5",
      },
    },
  },
  plugins: [],
};
