module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  // Vendored design system, build output, and config files are not app source.
  ignorePatterns: [
    'dist',
    'node_modules',
    'design',
    'vite.config.ts',
    '.eslintrc.cjs',
  ],
  rules: {
    // Chart.js + react-chartjs-2 callbacks are loosely typed upstream; `any`
    // is pragmatic here and not worth eslint failing the build over.
    '@typescript-eslint/no-explicit-any': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
}
