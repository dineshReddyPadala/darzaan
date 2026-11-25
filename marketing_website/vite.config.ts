import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const MISCONFIGURED =
  'Set VITE_API_URL=https://api.darzaan.com in marketing_website/.env.production before building for production.';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production') {
    const base = (env.VITE_API_URL ?? '').trim();
    if (!base || base === 'https://darzaan.com' || base === 'https://www.darzaan.com') {
      throw new Error(MISCONFIGURED);
    }
    try {
      const host = new URL(base).hostname;
      if (host !== 'api.darzaan.com') {
        throw new Error(`VITE_API_URL must point at api.darzaan.com (got ${host}).`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('VITE_API_URL must')) throw e;
      throw new Error(MISCONFIGURED);
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true } },
    },
  };
});