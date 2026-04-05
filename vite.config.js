import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: false,
        type: 'module', 
      },
      registerType: 'autoUpdate',
      injectRegister: 'auto', 
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ShoxGame App',
        short_name: 'ShoxGame',
        description: 'ShoxGame o\'yinlar tizimi',
        theme_color: '#091020',
        background_color: '#091020',
        display: 'standalone', 
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],

  // ── SERVER SOZLAMALARI (TUNNEL UCHUN OPTIMALLASHTIRILDI) ──
  server: {
    port: 5174,
    strictPort: true,
    host: '0.0.0.0',
    cors: true,
    origin: 'https://dev-game.shoxpro.uz',
    allowedHosts: ['.shoxpro.uz'], 
    hmr: {
      protocol: 'wss',
      host: 'dev-game.shoxpro.uz',
      clientPort: 443,
      path: '@vite-hmr'
    }
  },

  optimizeDeps: {
    force: true
  },

  // ── BUILD SOZLAMALARI ──
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});