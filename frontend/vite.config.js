import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:4000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true
        },
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true
        }
      }
    }
  }
})
