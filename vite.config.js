import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const entry = resolve(import.meta.dirname, 'SOC_CILEUNGSI_PRO_v4.html');
const entryName = 'SOC_CILEUNGSI_PRO_v4.html';

export default defineConfig({
  plugins: [
    {
      name: 'serve-entry-at-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url?.startsWith('/?')) {
            req.url = '/' + entryName + req.url.slice(1);
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url?.startsWith('/?')) {
            req.url = '/' + entryName + req.url.slice(1);
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: entry
    }
  }
});
