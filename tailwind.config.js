/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '320px',      // Extra small mobile devices
        'sm': '480px',      // Small mobile devices
        'md': '768px',      // Tablets
        'lg': '1024px',     // Desktop
        'xl': '1200px',     // Large desktop
        '2xl': '1440px',    // Extra large desktop
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxWidth: {
        'screen-sm': '100vw',
      },
      colors: {
        // Modern LMS Primary Colors - Professional Blue-based palette
        primary: {
          50: '#eff6ff',   // Very light blue
          100: '#dbeafe',  // Light blue
          200: '#bfdbfe',  // Lighter blue
          300: '#93c5fd',  // Medium light blue
          400: '#60a5fa',  // Medium blue
          500: '#3b82f6',  // Main primary blue
          600: '#2563eb',  // Darker blue
          700: '#1d4ed8',  // Dark blue
          800: '#1e40af',  // Very dark blue
          900: '#1e3a8a',  // Darkest blue
          950: '#172554',  // Ultra dark blue
        },

        // Secondary Colors - Professional Neutral Gray
        secondary: {
          50: '#f8fafc',   // Very light gray
          100: '#f1f5f9',  // Light gray
          200: '#e2e8f0',  // Lighter gray
          300: '#cbd5e1',  // Medium light gray
          400: '#94a3b8',  // Medium gray
          500: '#64748b',  // Main secondary gray
          600: '#475569',  // Darker gray
          700: '#334155',  // Dark gray
          800: '#1e293b',  // Very dark gray
          900: '#0f172a',  // Darkest gray
          950: '#020617',  // Ultra dark gray
        },

        // Success Colors - Professional Blue for positive actions (NO GREEN)
        success: {
          50: '#eff6ff',   // Very light blue
          100: '#dbeafe',  // Light blue
          200: '#bfdbfe',  // Lighter blue
          300: '#93c5fd',  // Medium light blue
          400: '#60a5fa',  // Medium blue
          500: '#3b82f6',  // Main success blue
          600: '#2563eb',  // Darker blue
          700: '#1d4ed8',  // Dark blue
          800: '#1e40af',  // Very dark blue
          900: '#1e3a8a',  // Darkest blue
          950: '#172554',  // Ultra dark blue
        },

        // Warning Colors - Amber for caution
        warning: {
          50: '#fffbeb',   // Very light amber
          100: '#fef3c7',  // Light amber
          200: '#fde68a',  // Lighter amber
          300: '#fcd34d',  // Medium light amber
          400: '#fbbf24',  // Medium amber
          500: '#f59e0b',  // Main warning amber
          600: '#d97706',  // Darker amber
          700: '#b45309',  // Dark amber
          800: '#92400e',  // Very dark amber
          900: '#78350f',  // Darkest amber
          950: '#451a03',  // Ultra dark amber
        },

        // Error Colors - Red for errors and danger
        error: {
          50: '#fef2f2',   // Very light red
          100: '#fee2e2',  // Light red
          200: '#fecaca',  // Lighter red
          300: '#fca5a5',  // Medium light red
          400: '#f87171',  // Medium red
          500: '#ef4444',  // Main error red
          600: '#dc2626',  // Darker red
          700: '#b91c1c',  // Dark red
          800: '#991b1b',  // Very dark red
          900: '#7f1d1d',  // Darkest red
          950: '#450a0a',  // Ultra dark red
        },

        // Neutral Colors - Enhanced gray scale for better contrast
        neutral: {
          50: '#fafafa',   // Very light gray
          100: '#f5f5f5',  // Light gray
          200: '#e5e5e5',  // Lighter gray
          300: '#d4d4d4',  // Medium light gray
          400: '#a3a3a3',  // Medium gray
          500: '#737373',  // Main neutral gray
          600: '#525252',  // Darker gray
          700: '#404040',  // Dark gray
          750: '#333333',  // Custom dark gray
          800: '#262626',  // Very dark gray
          900: '#171717',  // Darkest gray
          950: '#0a0a0a',  // Ultra dark gray
        },

        // Educational Context Colors - Professional Indigo
        academic: {
          50: '#eef2ff',   // Very light indigo
          100: '#e0e7ff',  // Light indigo
          200: '#c7d2fe',  // Lighter indigo
          300: '#a5b4fc',  // Medium light indigo
          400: '#818cf8',  // Medium indigo
          500: '#6366f1',  // Main academic indigo
          600: '#4f46e5',  // Darker indigo
          700: '#4338ca',  // Dark indigo
          800: '#3730a3',  // Very dark indigo
          900: '#312e81',  // Darkest indigo
          950: '#1e1b4b',  // Ultra dark indigo
        },
      },

      // Enhanced Typography Scale for LMS
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],

        // LMS-specific typography
        'display-1': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-2': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-3': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-1': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-2': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'overline': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase' }],
      },

      // Enhanced Spacing Scale
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',

        // LMS-specific spacing
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
        '38': '9.5rem',   // 152px
        '42': '10.5rem',  // 168px
        '46': '11.5rem',  // 184px
        '50': '12.5rem',  // 200px
        '54': '13.5rem',  // 216px
        '58': '14.5rem',  // 232px
        '62': '15.5rem',  // 248px
        '66': '16.5rem',  // 264px
        '70': '17.5rem',  // 280px
        '74': '18.5rem',  // 296px
        '78': '19.5rem',  // 312px
        '82': '20.5rem',  // 328px
        '86': '21.5rem',  // 344px
        '90': '22.5rem',  // 360px
        '94': '23.5rem',  // 376px
        '98': '24.5rem',  // 392px
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        // Existing soft shadows
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

        // Modern LMS shadows
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-focus': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'input': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        'sidebar': '2px 0 4px 0 rgba(0, 0, 0, 0.05)',
        'header': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'floating': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },

      // Enhanced Border Radius
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',

        // LMS-specific radius
        'card': '0.75rem',
        'button': '0.5rem',
        'input': '0.5rem',
        'badge': '0.375rem',
        'avatar': '50%',
      },

      // Enhanced Z-Index Scale
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'auto': 'auto',

        // LMS-specific z-index
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [],
};
