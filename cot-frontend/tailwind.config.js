import gemPreset from './design/preset.cjs';

/** @type {import('tailwindcss').Config} */
export default {
  // @gem/design is the single source of truth for palette, semantic tokens
  // (light + dark), radius, fonts, dark mode ('class'), and the --chart-1…12 series.
  presets: [gemPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        // CoT-specific subtle card elevation — not provided by the preset.
        'gem': '0px 1px 3px 0px #0000001A',
      },
    },
  },
}
