import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize VITE_OPENROUTER_API_KEY (Vercel standard), then fallback to others
  // Hardcoded key removed as per request
  const apiKey = process.env.VITE_OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || 
                 process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || "";
  
  const adminHash = process.env.VITE_ADMIN_HASH || env.VITE_ADMIN_HASH || "9e38e8d688743e0d07d669a1fc981589e68b725679f297e788950390f7725913"; 
  const secretSalt = process.env.VITE_SECRET_SALT || env.VITE_SECRET_SALT || "UCH_2025_SECURE_SALT_VS";

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.OPENROUTER_API_KEY': JSON.stringify(apiKey),
      'process.env.ADMIN_HASH': JSON.stringify(adminHash),
      'process.env.SECRET_SALT': JSON.stringify(secretSalt),
    },
  };
});