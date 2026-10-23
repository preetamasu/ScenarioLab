import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { target: env.BACKEND_URL || 'http://localhost:8080', changeOrigin: true };
  return {
    plugins: [react()],
    server: {
      host: 'localhost', port: 5173, strictPort: true,
      proxy: { '/api': proxy, '/logout': proxy },
    },
  };
});
