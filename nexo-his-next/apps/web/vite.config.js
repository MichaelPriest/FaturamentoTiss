import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 4180 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/nexo-app.js',
        chunkFileNames: 'assets/nexo-[name].js',
        assetFileNames: asset => asset.names?.some(name => name.endsWith('.css')) ? 'assets/nexo-app.css' : 'assets/nexo-[name][extname]'
      }
    }
  }
});
