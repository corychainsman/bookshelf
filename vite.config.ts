import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/bookshelf/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3847,
    host: '0.0.0.0',
  },
  preview: {
    port: 3847,
    host: '0.0.0.0',
  },
})
