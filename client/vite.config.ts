import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The API runs on its own port; the dev server proxies /api to it so the browser sees one origin.
const apiTarget = process.env.TASKFORGE_API_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react()],
  // Resolve @taskforge/shared to its TypeScript sources so no server build is needed.
  resolve: { conditions: ['@taskforge/source', 'browser', 'module'] },
  server: {
    port: Number(process.env.CLIENT_PORT ?? 5173),
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
