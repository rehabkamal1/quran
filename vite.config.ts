import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'logo.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // Allow up to 30MB precache
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
