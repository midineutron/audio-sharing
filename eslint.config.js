import js from '@eslint/js'
import globals from 'globals'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'build', '.svelte-kit', 'node_modules'],
  },
  {
    files: ['**/*.{ts,js,svelte}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parser: tseslint.parser,
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: eslintPluginSvelte.parser,
      parserOptions: {
        parser: {
          ts: tseslint.parser,
        },
      },
    },
    plugins: {
      svelte: eslintPluginSvelte,
    },
    extends: [eslintPluginSvelte.configs['recommended']],
  },
  eslintConfigPrettier
)
