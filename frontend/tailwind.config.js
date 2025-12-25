// ФИНАЛЬНАЯ ВЕРСИЯ КОНФИГА
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './index.html', // <-- ДОБАВЬ ЭТУ СТРОКУ
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    screens: {
      'sm': '640px',
      'md': '768px',
      'widget': '1280px', // <-- Вот он, наш новый breakpoint
      'lg': '1400px', // ✅ Вот он, твой новый десктопный breakpoint!
      'xl': '1600px', // Можешь заодно настроить и другие размеры
    },

    // [!code focus start]
    // 2. Указываем Tailwind, что наш основной шрифт теперь Nunito
    fontFamily: {
      sans: ['Nunito', 'sans-serif'],
    },
    // [!code focus end]
    extend: {
      // НАШ БЛОК ДЛЯ ТИПОГРАФИИ, КОТОРЫЙ МЫ ВОЗВРАЩАЕМ
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            'h1, h2, h3, h4, h5, h6': { fontWeight: theme('fontWeight.bold') },
            'strong, b': { fontWeight: theme('fontWeight.bold') },
          },
        },
        invert: {
          css: {
            h1: { fontSize: theme('fontSize.3xl'), fontWeight: theme('fontWeight.bold'), color: theme('colors.gray.100') },
            h2: { fontSize: theme('fontSize.2xl'), fontWeight: theme('fontWeight.bold'), color: theme('colors.gray.100') },
            h3: { fontSize: theme('fontSize.xl'), fontWeight: theme('fontWeight.bold'), color: theme('colors.gray.200') },
            h4: { fontSize: theme('fontSize.lg'), fontWeight: theme('fontWeight.bold'), color: theme('colors.gray.200') },
            'strong, b': { fontWeight: theme('fontWeight.bold'), color: theme('colors.gray.100') },
            p: { color: theme('colors.gray.300') },
            a: { color: theme('colors.cyan.400'), '&:hover': { color: theme('colors.cyan.500') } },
            blockquote: { color: theme('colors.gray.400'), borderLeftColor: theme('colors.gray.700') },
            'ul > li::before': { backgroundColor: theme('colors.gray.600') },
            'ol > li::before': { color: theme('colors.gray.400') },
            hr: { borderColor: theme('colors.gray.700') },
            code: { color: theme('colors.gray.100') },
            'thead, tbody tr': { borderBottomColor: theme('colors.gray.700') },
          },
        },
      }),
      // БЛОК ОТ SHADCN
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography'), require('@tailwindcss/container-queries')],
}

