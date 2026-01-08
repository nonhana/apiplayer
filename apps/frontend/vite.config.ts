import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import { compression } from 'vite-plugin-compression2'
import monacoEditorEsmPlugin from 'vite-plugin-monaco-editor-esm'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname)
  return {
    plugins: [
      vue(),
      tailwindcss(),
      compression({
        algorithms: ['gzip'],
        exclude: [/\.(gz)$/],
        threshold: 10240,
        deleteOriginalAssets: false,
      }),
      monacoEditorEsmPlugin({
        languageWorkers: ['editorWorkerService', 'json'],
      }),
      visualizer({
        open: false,
        gzipSize: true,
        filename: 'stats.html',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['reka-ui', 'lucide-vue-next'],
            'utils-vendor': ['@vueuse/core', 'dayjs', 'lodash-es', 'zod'],
            'monaco-editor': ['monaco-editor'],
            'shiki': ['shiki'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    // dev mode available
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
