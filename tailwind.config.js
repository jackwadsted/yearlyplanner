import plugin from 'tailwindcss/plugin';
import colors from 'tailwindcss/colors';

/**
 * Theming
 * -------
 * Palettes used by the UI are exposed as CSS variables ("r g b" triplets) so a
 * theme can be switched at runtime with `<html data-theme="...">`.
 *
 *  - brand / accent : theme specific palettes (primary + complementary colour)
 *  - slate, amber, rose, blue, violet, emerald, orange : fixed palettes that are
 *    only re-mapped (lightness inverted) by dark themes
 *  - surface / strong* : semantic tokens for card backgrounds and dark buttons
 *
 * Add a theme by adding an entry to THEMES (and to src/themes.ts for the picker).
 */
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const FIXED = ['slate', 'amber', 'rose', 'blue', 'violet', 'emerald', 'orange'];
const THEMED = ['brand', 'accent'];

const THEMES = {
  default: { brand: 'teal', accent: 'indigo' },
  pink: { brand: 'pink', accent: 'emerald' },
  orange: { brand: 'orange', accent: 'indigo' },
  black: { brand: 'cyan', accent: 'fuchsia', dark: true },
  blue: { brand: 'sky', accent: 'orange' },
  red: { brand: 'red', accent: 'cyan' },
};

// Shade remapping applied by dark themes (light shade -> dark theme shade)
const DARK_SLATE = { 50: 950, 100: 900, 200: 700, 300: 600, 400: 500, 500: 400, 600: 300, 700: 200, 800: 100, 900: 50, 950: 50 };
const DARK_COLOR = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 500, 700: 300, 800: 200, 900: 100, 950: 50 };

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

const rawVars = (name, palette) =>
  Object.fromEntries(SHADES.map((s) => [`--raw-${name}-${s}`, toRgb(palette[s])]));

const effectiveVars = (name, map) =>
  Object.fromEntries(SHADES.map((s) => [`--${name}-${s}`, `var(--raw-${name}-${map ? map[s] : s})`]));

const allEffective = (dark) => ({
  ...effectiveVars('slate', dark ? DARK_SLATE : null),
  ...[...FIXED.filter((n) => n !== 'slate'), ...THEMED].reduce(
    (acc, n) => ({ ...acc, ...effectiveVars(n, dark ? DARK_COLOR : null) }),
    {}
  ),
});

const LIGHT_TOKENS = {
  '--surface': '255 255 255',
  '--strong': 'var(--raw-slate-900)',
  '--strong-hover': 'var(--raw-slate-800)',
  '--strong-soft': 'var(--raw-slate-700)',
};

const DARK_TOKENS = {
  '--surface': 'var(--raw-slate-800)',
  '--strong': 'var(--raw-slate-600)',
  '--strong-hover': 'var(--raw-slate-500)',
  '--strong-soft': 'var(--raw-slate-500)',
};

const themePalette = (theme) => ({
  ...rawVars('brand', colors[theme.brand]),
  ...rawVars('accent', colors[theme.accent]),
});

const themingPlugin = plugin(({ addBase }) => {
  const base = {
    ':root': {
      ...FIXED.reduce((acc, n) => ({ ...acc, ...rawVars(n, colors[n]) }), {}),
      ...themePalette(THEMES.default),
      ...allEffective(false),
      ...LIGHT_TOKENS,
    },
    // Elements that must keep the light palette even in dark themes (e.g. the dashboard banner)
    '.theme-fixed': {
      ...allEffective(false),
      ...LIGHT_TOKENS,
    },
  };

  for (const [id, theme] of Object.entries(THEMES)) {
    if (id === 'default') continue;
    base[`:root[data-theme="${id}"]`] = {
      ...themePalette(theme),
      ...(theme.dark ? { ...allEffective(true), ...DARK_TOKENS, 'color-scheme': 'dark' } : {}),
    };
  }

  addBase(base);
});

const themed = (name) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries([...FIXED, ...THEMED].map((n) => [n, themed(n)])),
        surface: 'rgb(var(--surface) / <alpha-value>)',
        strong: {
          DEFAULT: 'rgb(var(--strong) / <alpha-value>)',
          hover: 'rgb(var(--strong-hover) / <alpha-value>)',
          soft: 'rgb(var(--strong-soft) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [themingPlugin],
}
