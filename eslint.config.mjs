import { FlatCompat } from '@eslint/eslintrc'
import next from '@next/eslint-plugin-next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'eslint.config.mjs',
      'supabase/functions/**',
    ],
  },
  {
    plugins: {
      '@next/next': next,
    },
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
]
