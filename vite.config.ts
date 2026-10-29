import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// BASE_PATH lets CI build for a sub-path host such as GitHub Pages (/<repo>/).
const base = process.env.BASE_PATH ? `${process.env.BASE_PATH.replace(/\/$/, '')}/` : '/'
const port = parseInt(process.env.PORT || '8443')

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { host: '0.0.0.0', port, strictPort: true },
  preview: { host: '0.0.0.0', port },
})
