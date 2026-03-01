import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'public',
  plugins: [react()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  publicDir: false,
  build: {
    outDir: 'docs',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'public/index.html'),
      },
    },
  },
})
