import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          inverse: 'var(--bg-inverse)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
          inverse: 'var(--text-inverse)',
        },
        accent: {
          purple: 'var(--accent-purple)',
          sage: 'var(--accent-sage)',
        },
        line: {
          visible: 'var(--border-visible)',
          subtle: 'var(--border-subtle)',
        },
      },
      borderRadius: {
        action: 'var(--radius-action)',
        sm: 'var(--radius-small)',
        md: 'var(--radius-medium)',
        lg: 'var(--radius-large)',
        modal: 'var(--radius-modal)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        eyebrow: ['14px', { lineHeight: '20px', letterSpacing: '0.08em' }],
        '6xl-display': ['40px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
        '7xl-display': ['56px', { lineHeight: '60px', letterSpacing: '-0.03em' }],
        '8xl-display': ['72px', { lineHeight: '74px', letterSpacing: '-0.035em' }],
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
