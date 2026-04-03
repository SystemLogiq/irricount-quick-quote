/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        field: {
          bg: '#0f172a',
          surface: '#1e293b',
          elevated: '#273549',
          border: '#334155',
          muted: '#475569',
          text: '#f1f5f9',
          sub: '#94a3b8',
          accent: '#22d3ee',
          'accent-dark': '#0e7490',
          positive: '#4ade80',
          warning: '#fb923c',
          danger: '#f87171',
        },
      },
      minHeight: {
        tap: '48px',
      },
      fontSize: {
        'tap-label': ['15px', { lineHeight: '1.3', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
