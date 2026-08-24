import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages deploys to /repo-name/ subpath — detect via env var
const isGHPages = process.env.GITHUB_PAGES === 'true' || process.env.DEPLOY_TARGET === 'ghpages';

export default defineConfig({
  plugins: [react()],
  // Use subpath for GitHub Pages, root for local dev / Render
  base: isGHPages ? '/blockchain-agri-supply-chain/' : '/',
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
