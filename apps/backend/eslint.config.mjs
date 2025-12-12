import antfu from '@antfu/eslint-config'

export default antfu({
  javascript: true,
  typescript: true,
  jsonc: true,
  markdown: true,
  yaml: true,
  rules: {
    'no-console': 'off',
    'ts/consistent-type-imports': 'off',
    'no-case-declarations': 'off',
    'import/consistent-type-specifier-style': 'off',
  },
  ignores: ['dist/**', 'node_modules/**', 'prisma/**'],
})
