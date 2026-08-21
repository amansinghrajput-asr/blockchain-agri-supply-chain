import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    allowedHosts: true, // Allow ngrok/localtunnel/localhost.run domains
    hmr: { clientPort: 443 }, // Fix WebSocket HMR over HTTPS tunnels
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
