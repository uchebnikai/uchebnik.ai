
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize process.env -> loaded env file -> explicit fallback provided by user to fix missing key
  const apiKey = process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || '';
  const openRouterKey = process.env.VITE_OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || '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';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Safely expose the variables. JSON.stringify ensures they are treated as string literals.
      'process.env.GOOGLE_API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(openRouterKey), 
    },
  };
});
