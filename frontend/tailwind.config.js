/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                guardian: {
                    primary: '#6366f1',    // Indigo
                    secondary: '#8b5cf6',  // Violet
                    accent: '#10b981',     // Emerald (Safe)
                    danger: '#ef4444',     // Red (Blocked)
                    warning: '#f59e0b',    // Amber
                    bg: '#0f172a',         // Slate 900
                    card: '#1e293b',       // Slate 800
                    border: '#334155',     // Slate 700
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
