/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"PingFang TC"', '"Noto Sans TC"', '"Microsoft JhengHei"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      // Apple-style palette
      colors: {
        apple: {
          bg: '#f5f5f7',
          sidebar: '#fbfbfd',
          fill: '#e8e8ed',
          'fill-hover': '#dcdce1',
          ink: '#1d1d1f',
          'ink-2': '#6e6e73',
          'ink-3': '#86868b',
          line: '#d2d2d7',
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          'blue-soft': '#e8f1fc',
          red: '#ff3b30',
          orange: '#ff9f0a',
          green: '#34c759',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        pop: '0 24px 64px rgba(0, 0, 0, 0.18)',
        thumb: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        pop: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        pop: 'pop 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        fade: 'fade 0.18s ease-out',
      },
    },
  },
  plugins: [],
}
