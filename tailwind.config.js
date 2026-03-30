/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    
  ],
  theme: {
    extend: {
      

      /* ======================
         PREMIUM COLOR SYSTEM
      ====================== */

      colors: {
        'agri-green': '#00a651', // keep existing

        brand: {
          50:  '#f4f8ff',
          100: '#e6f0ff',
          200: '#cce0ff',
          300: '#99c2ff',
          400: '#66a3ff',
          500: '#3385ff',
          600: '#1d6fe8',
          700: '#1456b3',
          800: '#0c3d80',
          900: '#06264d',
        },

        surface: '#f8fafc',
        card: '#ffffff',
        border: '#e2e8f0',

        textPrimary: '#0f172a',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
      },

      /* ======================
         TYPOGRAPHY
      ====================== */

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },

      fontSize: {
        'hero': ['3.2rem', { lineHeight: '1.1' }],
      },

      /* ======================
         PREMIUM SHADOWS
      ====================== */

      boxShadow: {
        soft: '0 4px 20px rgba(15, 23, 42, 0.05)',
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        hover: '0 20px 45px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 4px rgba(51, 133, 255, 0.15)',
      },

      /* ======================
         RADIUS SYSTEM
      ====================== */

      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.75rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },

      /* ======================
         GRADIENTS
      ====================== */

      backgroundImage: {
        'agri-gradient': 'linear-gradient(135deg, #00a651 0%, #008c44 100%)',
        'premium-gradient':
          'linear-gradient(135deg, #1d6fe8 0%, #1456b3 100%)',
        'soft-gradient':
          'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      },

      /* ======================
         ANIMATIONS (KEEP YOURS)
      ====================== */

      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'slide-down': 'slideDown 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 1s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',

        // NEW subtle premium animations
        'fade-soft': 'fadeSoft 0.4s ease-out forwards',
        'float-up': 'floatUp 0.6s ease-out forwards',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },

        // NEW
        fadeSoft: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

    },
  },
  plugins: [],
}
