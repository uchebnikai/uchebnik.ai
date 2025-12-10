
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // SECURITY FIX: Do not hardcode API keys. 
  // Ensure you have a .env file with OPENROUTER_API_KEY=sk-or-v1-...
  const apiKey = env.OPENROUTER_API_KEY || "";

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.OPENROUTER_API_KEY': JSON.stringify(apiKey),
    },
  };
});
