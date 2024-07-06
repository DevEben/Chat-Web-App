import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4321',
    },
  },
  build: {
    outDir: 'dist' // Ensure this is set to 'dist'
  }
});
