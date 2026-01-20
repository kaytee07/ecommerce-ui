/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Dark, Bold (World Genius)
        primary: {
          DEFAULT: '#1C1C1C',
          hover: '#000000',
          light: '#F5F5F5',
        },
        // Accent - Subtle Gold
        accent: {
          DEFAULT: '#C4A77D',
          hover: '#B39468',
        },
        // Cream Background (Vlisco)
        cream: {
          DEFAULT: '#FBF9F7',
          dark: '#F5F3F0',
        },
        // Semantic colors
        success: {
          DEFAULT: '#2E7D32',
          bg: '#E8F5E9',
        },
        warning: {
          DEFAULT: '#ED6C02',
          bg: '#FFF4E5',
        },
        error: {
          DEFAULT: '#D32F2F',
          bg: '#FFEBEE',
        },
        info: {
          DEFAULT: '#0288D1',
          bg: '#E1F5FE',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
        '10xl': '10rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'none': '0',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
