import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  outDir: 'dist',
  sourcemap: false,
  clean: true,
  target: 'node20',
  platform: 'node',
  dts: false,
  inlineOnly: ['@faker-js/faker'],
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    'reflect-metadata',
    'rxjs',
  ],
})
