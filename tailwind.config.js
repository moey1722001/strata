/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#071426',
        navy: '#0c1f35',
        harbour: '#12385f',
        mist: '#f5f7fa',
        line: '#e6ebf1',
        gold: '#b7894b',
        gum: '#2f7d78'
      },
      boxShadow: {
        soft: '0 18px 60px rgba(7, 20, 38, 0.08)'
      }
    }
  },
  plugins: []
};
