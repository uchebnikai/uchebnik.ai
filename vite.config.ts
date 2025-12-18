
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Expose GOOGLE_API_KEY as API_KEY for @google/genai SDK
  const apiKey = process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || "";
  
  const adminHash = process.env.VITE_ADMIN_HASH || env.VITE_ADMIN_HASH || "9e38e8d688743e0d07d669a1fc981589e68b725679f297e788950390f7725913"; 
  const secretSalt = process.env.VITE_SECRET_SALT || env.VITE_SECRET_SALT || "UCH_2025_SECURE_SALT_VS";

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.ADMIN_HASH': JSON.stringify(adminHash),
      'process.env.SECRET_SALT': JSON.stringify(secretSalt),
    },
  };
});
