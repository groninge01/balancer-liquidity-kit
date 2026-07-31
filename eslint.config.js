import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'
import { resolve } from 'node:path'

const project = resolve(process.cwd(), 'tsconfig.json')

const config = [
  {
    ignores: [
      '.*.js',
      'node_modules/**',
      'dist/**',
      '.next/**',
      '**/.next/**',
      '**/dist/**',
      'next-env.d.ts',
      'next.config.ts',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...reactPlugin.configs.flat.recommended,
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.node,
        React: true,
        JSX: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project,
        },
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      'react/jsx-sort-props': ['error', { ignoreCase: true }],
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      curly: ['error', 'multi-line'],
      'react/react-in-jsx-scope': 'off',
      'no-console': 'off',
      'max-len': [
        'warn',
        {
          code: 120,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreTemplateLiterals: true,
          ignoreStrings: true,
        },
      ],
    },
  },
]

export default config
