/* Synced from @gem/design — do not edit here; edit in the monorepo. */
/**
 * @gem/design — raw brand tokens as data, for code that needs the values
 * directly (charts, canvas, JS-driven styles) rather than Tailwind classes.
 * The Tailwind preset (preset.cjs) and theme.css are the styling entry points;
 * this is the underlying source of truth for the palette.
 */
const gemBlack = {
  25: '#E7DCDA',
  50: '#F3EEED',
  75: '#B9ADB4',
  100: '#939393',
  200: '#7D757D',
  300: '#3F3F42',
  400: '#2C2C2F',
  500: '#272727',
  600: '#242424',
  700: '#202021',
  800: '#1E1E1E',
  900: '#1B1B1B',
  1000: '#1A1A1A',
  DEFAULT: '#3F3E3F',
};

const brand = {
  gemPurple: '#352351',
  gemPurpleHover: '#5D4F74',
  gemCoral: '#ff5748',
  gemGold: '#FDB71A',
  gemTeal: '#08B86E',
  gemStock: '#1588E0',
  gemEtf: '#9333EA',
  gemCrypto: '#EAB308',
  gemCash: '#22C55E',
};

/** Semantic token names available as Tailwind classes / CSS vars (light & dark aware). */
const semanticTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'primary',
  'secondary',
  'muted',
  'muted-foreground',
  'accent',
  'destructive',
  'border',
  'input',
  'ring',
  'surface',
  'surface-raised',
  'subtle-border',
  'subtle-foreground',
  'hover-surface',
  'card-muted',
  'secondary-foreground-muted',
];

const radius = '0.75rem';
const fontFamily = { sans: ['Libre Franklin', 'sans-serif'], space: ['"Space Grotesk"'] };

module.exports = { gemBlack, brand, semanticTokens, radius, fontFamily };
