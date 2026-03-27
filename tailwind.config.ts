import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1a6fc4",
          orange: "#e88c3a",
          ink: "#10213a",
          mist: "#eef4fb"
        },
        tier: {
          topText: "#3b6d11",
          topBg: "#eaf3de",
          midText: "#854f0b",
          midBg: "#faeeda",
          devText: "#a32d2d",
          devBg: "#fcebeb"
        }
      },
      boxShadow: {
        soft: "0 20px 50px rgba(16, 33, 58, 0.08)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(26, 111, 196, 0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
