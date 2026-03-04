import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // 🚀 NEW: Force PWA to work on localhost!
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Eco Tour Nepal',
        short_name: 'EcoTour',
        description: 'Authentic eco-friendly tours and local crafts in Nepal.',
        theme_color: '#0f172a', 
        background_color: '#f8fafc', 
        display: 'standalone', 
        icons: [
          {
            src: '/vite.svg', 
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});