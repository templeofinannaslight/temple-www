import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base public path. Defaults to '/' (correct for the apex custom domain).
  // Set BASE_PATH=/repo-name/ when deploying to a GitHub Pages *project* page
  // (e.g. user.github.io/repo) so assets resolve under the sub-path.
  base: process.env.BASE_PATH || '/',
  // Expose any env var starting with VITE_ or AUTH0_ to the client via import.meta.env.
  // AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE, AUTH0_SCOPE are public OAuth values.
  envPrefix: ['VITE_', 'AUTH0_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ssr: {
    resolve: {
      conditions: ['module-sync', 'import', 'module', 'default'],
      externalConditions: ['module-sync', 'import', 'module', 'default'],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
