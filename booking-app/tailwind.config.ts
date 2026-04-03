import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          mid: '#1A3A5C',
        },
        teal: {
          DEFAULT: '#00B4D8',
          dark: '#0077B6',
          light: '#E0F7FC',
        },
        amber: {
          DEFAULT: '#F4A261',
          dark: '#E07A3A',
        },
        surface: '#F8FAFC',
        muted: '#64748B',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
