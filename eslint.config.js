import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  { files: ['scripts/*.mjs'], languageOptions: { globals: {process:'readonly',fetch:'readonly',URL:'readonly',AbortSignal:'readonly'} } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
)
