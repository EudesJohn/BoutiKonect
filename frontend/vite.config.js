import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-icon-180.png', 'logo.jpg'],
      manifest: {
        name: 'BoutiKonect',
        short_name: 'BoutiKonect',
        description: 'Ventes et Services au Bénin',
        theme_color: '#FF6A00',
        background_color: '#0d1b2a',
        display: 'standalone',
        icons: [
          {
            src: 'manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('supabase.co'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})