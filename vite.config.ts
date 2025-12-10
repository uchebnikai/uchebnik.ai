

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Check for OPENROUTER_API_KEY, then API_KEY, then process.env.API_KEY, finally fallback to provided key
  const apiKey = env.OPENROUTER_API_KEY || env.API_KEY || process.env.API_KEY || "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";
  
  // SECURITY: Load secrets from environment or fallback to default (for demo purposes only)
  // In production, strictly use .env files
  // SHA256 of VS09091615!
  const adminHash = env.VITE_ADMIN_HASH || "9e38e8d688743e0d07d669a1fc981589e68b725679f297e788950390f7725913"; 
  const secretSalt = env.VITE_SECRET_SALT || "UCH_2025_SECURE_SALT_VS";

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.OPENROUTER_API_KEY': JSON.stringify(apiKey),
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.ADMIN_HASH': JSON.stringify(adminHash),
      'process.env.SECRET_SALT': JSON.stringify(secretSalt),
    },
  };
});