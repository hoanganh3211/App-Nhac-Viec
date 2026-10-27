import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'custom-sw.js'],
      workbox: {
        importScripts: ['custom-sw.js'],
      },
      manifest: {
        name: 'Chia Việc Nhà - Nhắc Việc Chung',
        short_name: 'ViệcNhà',
        description: 'Ứng dụng chia việc nhà công bằng và nhắc việc cho nhóm ở chung',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
