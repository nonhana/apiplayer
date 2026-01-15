import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
  rules: {
    'ts/no-redeclare': 'off',
  },
})
