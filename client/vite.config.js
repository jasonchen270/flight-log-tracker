import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev we proxy /api to the local Express server so the React app can
// fetch('/api/...') without dealing with CORS or hardcoded hostnames.
// In prod the same URLs are served by Express directly (see server/src/index.js).
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
