/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kai: ['"LXGW WenKai TC"', '"BiauKai"', '"DFKai-SB"', '"標楷體"', '"Kaiti TC"', '"STKaiti"', '"KaiTi"', 'serif'],
        round: ['"Noto Sans HK"', '"PingFang HK"', '"Microsoft JhengHei"', 'sans-serif'],
      },
      colors: {
        ink: '#3b2a1a',
        cream: '#fff8e7',
      },
      boxShadow: {
        pop: '0 6px 0 rgba(0,0,0,0.18)',
        'pop-sm': '0 3px 0 rgba(0,0,0,0.18)',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        twinkle: { '0%,100%': { opacity: '0.3' }, '50%': { opacity: '1' } },
      },
      animation: {
        floaty: 'floaty 3s ease-in-out infinite',
        twinkle: 'twinkle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
