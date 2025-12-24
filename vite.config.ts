
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Expose GOOGLE_API_KEY as API_KEY for @google/genai SDK
  const apiKey = process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || "";
  
  // Removed ADMIN_HASH and SECRET_SALT injection to prevent leaking them in the frontend bundle.
  // Verification is now handled server-side.

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});
