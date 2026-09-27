import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.DEPLOY_TARGET === 'pages' ? '/astronaut-academy/' : './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    manifest: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,js}'],
  },
})
