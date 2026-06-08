import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#00D1C7', dark: '#00B8AF' },
        navy: { DEFAULT: '#0B1220', light: '#101A2E' },
      },
    },
  },
  plugins: [],
}
export default config
