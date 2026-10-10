import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Must match the port used by backend/local-server.js.
  const apiPort = process.env.API_PORT || loadEnv(mode, process.cwd(), '').API_PORT || 5000

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      // Forward /api requests to the local Express backend during development.
      // In production, vercel.json routes /api to backend/server.js instead.
      proxy: {
        '/api': `http://127.0.0.1:${apiPort}`,
      },
    },
  }
})
