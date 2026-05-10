import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://deshthaus-crm-production.up.railway.app',
      '/uploads': 'https://deshthaus-crm-production.up.railway.app'
    }
  }
})
