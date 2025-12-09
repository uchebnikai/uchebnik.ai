
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // OpenRouter API Key
  const apiKey = "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";

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
