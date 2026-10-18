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
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lifehub',
        short_name: 'Lifehub',
        description: 'Dein gemütliches Zuhause für Alltag, Essen und Training',
        lang: 'de',
        start_url: '.',
        display: 'standalone',
        theme_color: '#8fae8b',
        background_color: '#fbf6ee',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})
