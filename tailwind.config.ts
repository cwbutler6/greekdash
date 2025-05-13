import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Set brand colors to use the emerald palette consistently
      colors: {
        // Use Tailwind's emerald palette as the primary color
        primary: {
          50: 'var(--tw-color-emerald-50)',
          100: 'var(--tw-color-emerald-100)',
          200: 'var(--tw-color-emerald-200)',
          300: 'var(--tw-color-emerald-300)',
          400: 'var(--tw-color-emerald-400)',
          500: 'var(--tw-color-emerald-500)',
          600: 'var(--tw-color-emerald-600)', // Main brand color
          700: 'var(--tw-color-emerald-700)',
          800: 'var(--tw-color-emerald-800)',
          900: 'var(--tw-color-emerald-900)',
          950: 'var(--tw-color-emerald-950)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
