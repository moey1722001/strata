/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        primary: '#0f172a',
        navy: '#0f172a',
        secondary: '#1e293b',
        slatebrand: '#334155',
        harbour: '#334155',
        accent: '#3b82f6',
        mist: '#f8fafc',
        line: '#e2e8f0',
        gold: '#3b82f6',
        gum: '#2f7d78'
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
