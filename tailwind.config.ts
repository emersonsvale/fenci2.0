import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      // ============================================
      // CORES - Design System Fenci
      // ============================================
      colors: {
        // Cor primária (Verde Fenci)
        primary: {
          DEFAULT: '#22C55E',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        
        // Cores da marca
        brand: {
          green: '#22C55E',
          teal: '#115E4D',
          'teal-dark': '#0D4D41',
        },
        
        // Superfícies (backgrounds)
        surface: {
          light: '#FFFFFF',
          'light-secondary': '#F9FAFB',
          'light-tertiary': '#F3F4F6',
          dark: '#1A1A1A',
          'dark-secondary': '#262626',
          'dark-tertiary': '#333333',
        },
        
        // Texto
        content: {
          primary: '#111827',
          secondary: '#4B5563',
          tertiary: '#9CA3AF',
          'primary-dark': '#FFFFFF',
          'secondary-dark': '#D1D5DB',
          'tertiary-dark': '#6B7280',
        },
        
        // Bordas
        border: {
          light: '#E5E7EB',
          'light-secondary': '#D1D5DB',
          dark: '#374151',
          'dark-secondary': '#4B5563',
        },
        
        // Estados
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
          dark: '#166534',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1D4ED8',
        },
      },
      
      // ============================================
      // TIPOGRAFIA
      // ============================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Display
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        
        // Headings
        'heading-xl': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        
        // Body
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        
        // Caption / Labels
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      
      // ============================================
      // ESPAÇAMENTOS CUSTOMIZADOS
      // ============================================
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      
      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      
      // ============================================
      // SOMBRAS
      // ============================================
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'primary': '0 4px 14px 0 rgb(34 197 94 / 0.3)',
        'primary-lg': '0 8px 24px 0 rgb(34 197 94 / 0.35)',
        'card': '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        'card-hover': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
      },
      
      // ============================================
      // TRANSIÇÕES
      // ============================================
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // ============================================
      // ANIMAÇÕES
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      
      // ============================================
      // TAMANHOS MÁXIMOS
      // ============================================
      maxWidth: {
        'content': '1200px',
        'content-sm': '640px',
        'content-md': '768px',
        'content-lg': '1024px',
        'form': '400px',
        'modal-sm': '400px',
        'modal-md': '560px',
        'modal-lg': '720px',
      },
      
      // ============================================
      // Z-INDEX (modal acima de popover/dropdown para abrir por cima de menus)
      // ============================================
      zIndex: {
        'dropdown': '100',
        'sticky': '200',
        'overlay': '300',
        'popover': '400',
        'modal': '500',
        'tooltip': '600',
        'toast': '700',
      },
    },
  },
  plugins: [],
} satisfies Config
