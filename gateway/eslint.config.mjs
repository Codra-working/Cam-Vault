import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const baseDirectory = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });
const airbnb = compat.extends('airbnb-base');
const airbnbRules = Object.assign({}, ...airbnb.map((config) => config.rules));
const typescriptFiles = ['**/*.{ts,mts,cts}'];

export default [
  {
    ignores: [
      '**/node_modules/**', '**/coverage/**', '**/dist/**', '**/build/**',
      '**/docs/**', '**/.npm-cache/**', '**/storage/**',
      // MPEG-TS video fixture, not TypeScript source.
      '**/test/testVideoResult.ts',
    ],
  },
  ...airbnb,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node, ...globals.es2022 },
    },
    settings: {
      'import/resolver': {
        typescript: { project: join(baseDirectory, 'tsconfig.json') },
      },
    },
    rules: {
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      // Allow for...of while preserving Airbnb's other syntax restrictions.
      'no-restricted-syntax': airbnbRules['no-restricted-syntax'].filter(
        (restriction) => restriction.selector !== 'ForOfStatement',
      ),
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: ['**/test/**', '**/*.{spec,test}.*', '**/*.config.*'],
        packageDir: baseDirectory,
      }],
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: typescriptFiles,
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.mts', '.cts'],
      },
    },
    rules: {
      // Keep Airbnb's options while using rules that understand TypeScript.
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': airbnbRules['no-shadow'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': airbnbRules['no-unused-vars'],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': airbnbRules['no-use-before-define'],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': airbnbRules['no-unused-expressions'],
      'default-param-last': 'off',
      '@typescript-eslint/default-param-last': airbnbRules['default-param-last'],
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': airbnbRules['no-empty-function'],
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': airbnbRules['no-useless-constructor'],
      // NodeNext imports retain their runtime extensions (.js/.mjs/.cjs).
      'import/extensions': ['error', 'ignorePackages', {
        js: 'always',
        mjs: 'always',
        cjs: 'always',
        ts: 'never',
        mts: 'never',
        cts: 'never',
      }],
    },
  },
  {
    files: ['test/**/*.{js,mjs,cjs,ts,mts,cts}', '**/*.{spec,test}.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ['**/*.cjs', 'babel.config.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
];
