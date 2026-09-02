/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mine: {
          900: '#0a0d14',
          850: '#0f1420',
          800: '#141c2c',
          750: '#1a2337',
          700: '#232f48',
          600: '#344464',
          500: '#4d628c',
          400: '#738bb5',
          300: '#a3b8db',
          200: '#d0ddf2',
          100: '#eef3fb',
        },
        risk: {
          low: '#10b981',      // Emerald 500
          medium: '#f59e0b',   // Amber 500
          high: '#ef4444',     // Red 500
          stale: '#64748b',    // Slate 500
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'beacon': 'beacon 2s ease-out infinite',
      },
      keyframes: {
        beacon: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}

