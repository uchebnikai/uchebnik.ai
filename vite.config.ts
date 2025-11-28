
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize process.env (Vercel) -> loaded env file -> empty string
  const apiKey = process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || '';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Safely expose the variable. JSON.stringify ensures it's treated as a string literal.
      'process.env.GOOGLE_API_KEY': JSON.stringify(apiKey),
    },
  };
});
