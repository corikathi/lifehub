import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites unter /lifehub/
  base: process.env.GITHUB_ACTIONS ? '/lifehub/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Lifehub',
        short_name: 'Lifehub',
        description: 'Dein gemütliches Zuhause für Alltag, Essen und Training',
        lang: 'de',
        start_url: '.',
        display: 'standalone',
        theme_color: '#8fae8b',
        background_color: '#fbf6ee',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
