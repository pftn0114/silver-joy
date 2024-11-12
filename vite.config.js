import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/silver-joy/' : '/',
  build: {
    outDir: 'dist'
  }
}) 