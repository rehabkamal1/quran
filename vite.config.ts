import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'logo.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // Allow up to 30MB precache
        runtimeCaching: [
          {
            urlPattern: /^\/data\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-adhkar-data-v1',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^\/audio\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-audio-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio-cdn-v1',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/(hisnmuslim\.com|archive\.org|backup\.qurango\.net)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'adhkar-audio-cdn-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'هداية - منصة قرآنية',
        short_name: 'هداية',
        description: 'منصة إسلامية متكاملة للقرآن والأذكار ومواقيت الصلاة',
        theme_color: '#176B5B',
        background_color: '#F7F5EF',
        display: 'standalone',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
