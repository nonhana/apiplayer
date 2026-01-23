import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: {
    cjs: { outDir: 'dist/cjs' },
    esm: { outDir: 'dist/esm' },
  },
})
