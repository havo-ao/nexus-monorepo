/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_API_TARGET ?? 'http://localhost:8881',
        changeOrigin: true
      },
      '/market-api': {
        target: process.env.VITE_PROXY_MARKET_API_TARGET ?? 'http://localhost:8884',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/market-api/, '')
      },
      '/portfolio-api': {
        target: process.env.VITE_PROXY_PORTFOLIO_API_TARGET ?? 'http://localhost:8883',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/portfolio-api/, '')
      },
      '/compliance-api': {
        target: process.env.VITE_PROXY_COMPLIANCE_API_TARGET ?? 'http://localhost:8885',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/compliance-api/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['lcov', 'text'],
      reportsDirectory: 'coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}']
    }
  }
})
