/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#08060A',
        'secondary-bg': '#120B14',
        'card-bg': '#19101D',
        'card-border': '#2D1B36',
        'primary-pink': '#FF2D95',
        'neon-pink': '#FF00A8',
        'light-pink': '#FF78BD',
        'secondary-text': '#B8A9B8',
      },
      boxShadow: {
        'neon-sm': '0 0 10px rgba(255, 45, 149, 0.3)',
        'neon-md': '0 0 20px rgba(255, 45, 149, 0.45), 0 0 40px rgba(255, 0, 168, 0.2)',
        'neon-lg': '0 0 30px rgba(255, 45, 149, 0.6), 0 0 60px rgba(255, 0, 168, 0.35)',
        'neon-card': '0 8px 32px -4px rgba(0, 0, 0, 0.7), 0 0 16px rgba(255, 45, 149, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'arcade-grid': 'linear-gradient(to right, rgba(255, 45, 149, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 45, 149, 0.05) 1px, transparent 1px)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'glitch': 'glitch 1s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 15px rgba(255, 45, 149, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 30px rgba(255, 0, 168, 0.8))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
