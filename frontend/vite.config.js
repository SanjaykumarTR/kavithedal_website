import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── Dev Server ─────────────────────────────────────────────────────────────
  server: {
    proxy: {
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // ─── Path Aliases ───────────────────────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Note: directory is named 'assects' (typo), kept as-is to avoid breaking imports
      '@assects': path.resolve(__dirname, './src/assects'),
      '@assets': path.resolve(__dirname, './src/assects'),
    },
  },

  // ─── Production Build ───────────────────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React core from app code → cached independently
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Swiper is large (~100kB) — defer loading it from the main bundle
          'vendor-swiper': ['swiper'],
        },
      },
    },
  },
})
