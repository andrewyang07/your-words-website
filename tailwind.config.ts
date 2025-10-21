import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                // 圣经主题色彩
                bible: {
                    50: '#fefdfb',
                    100: '#fef7ed',
                    200: '#fef3c7',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                gold: {
                    300: '#fcd34d',
                    500: '#f59e0b',
                    700: '#d97706',
                },
            },
            fontFamily: {
                chinese: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out forwards',
                'slide-in': 'slideIn 0.6s ease-out',
                'card-hover': 'cardHover 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                cardHover: {
                    '0%': { transform: 'translateY(0) scale(1)' },
                    '100%': { transform: 'translateY(-5px) scale(1.02)' },
                },
            },
        },
    },
    plugins: [],
    darkMode: 'class',
};

export default config;
