import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // This codebase has a lot of legacy unused vars; keep signal but don't block builds.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],

      // Too strict for common patterns in this repo (e.g. exporting context + hooks in one file).
      'react-refresh/only-export-components': 'off',

      // Not a standard eslint rule; it flags many legitimate effects (fetching, syncing props -> state).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
