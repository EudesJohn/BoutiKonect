import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: true,
      includeAssets: ['favicon.svg', 'apple-icon-180.png', 'logo.jpg'],
      manifest: {
        name: 'BoutiKonect',
        short_name: 'BoutiKonect',
        description: 'Marketplace Bénin - Ventes et Services',
        theme_color: '#FF6A00',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('supabase.co'),
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})