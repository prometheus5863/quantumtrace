// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',                       // relative asset paths: the build runs from any folder or sub-path
  plugins: [react()],
  server: { port: 3000, host: '0.0.0.0' },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: { three: ['three'], r3f: ['@react-three/fiber', '@react-three/drei'] } } },
  },
});
