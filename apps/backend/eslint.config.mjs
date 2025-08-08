import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  javascript: true,
  jsonc: true,
  markdown: true,
  yaml: true,
  rules: {
    'no-console': 'off',
    'ts/consistent-type-imports': 'off',
    'no-case-declarations': 'off',
  },
})
