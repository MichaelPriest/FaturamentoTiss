import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

// Ponte exclusiva de publicação: a fonte permanece no projeto independente.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react/jsx-runtime', replacement: resolve(frontendRoot, 'node_modules/react/jsx-runtime.js') },
      { find: 'react-dom/client', replacement: resolve(frontendRoot, 'node_modules/react-dom/client.js') },
      { find: /^react-dom$/, replacement: resolve(frontendRoot, 'node_modules/react-dom/index.js') },
      { find: /^react$/, replacement: resolve(frontendRoot, 'node_modules/react/index.js') }
    ]
  },
  publicDir: false,
  build: { emptyOutDir: true }
});
