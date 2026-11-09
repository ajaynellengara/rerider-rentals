import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'Basis Grotesque Pro',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Swiggy-inspired Design Tokens
        brand: {
          orange: '#fc8019',
          'orange-hover': '#e37012',
          'orange-light': '#fff3e8',
        },
        charcoal: {
          DEFAULT: '#282c3f',
          dark: '#1e212f',
        },
        mutedSlate: {
          DEFAULT: '#686b78',
          light: '#93959f',
        },
        surface: {
          page: '#f4f4f5',
          card: '#ffffff',
          lightGrey: '#f1f1f6',
          border: '#e9e9eb',
        },
        border: '#e9e9eb',
        input: '#e9e9eb',
        ring: '#fc8019',
        background: '#f4f4f5',
        foreground: '#282c3f',
        primary: {
          DEFAULT: '#fc8019',
          foreground: '#ffffff',
          hover: '#e37012',
        },
        secondary: {
          DEFAULT: '#f1f1f6',
          foreground: '#282c3f',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f1f1f6',
          foreground: '#686b78',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#282c3f',
        },
        // Semantic Operational Statuses
        status: {
          available: '#16a34a',
          rented: '#2563eb',
          pending: '#d97706',
          maintenance: '#ea580c',
          accident: '#dc2626',
          completed: '#16a34a',
          cancelled: '#64748b',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
    },
  },
  plugins: [],
};

export default config;
