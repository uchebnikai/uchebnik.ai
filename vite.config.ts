
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  const apiKey = env.OPENROUTER_API_KEY || "";
  
  // SECURITY: Load secrets from environment or fallback to default (for demo purposes only)
  // In production, strictly use .env files
  const adminHash = env.VITE_ADMIN_HASH || "8d18406560945524389274291410111162453664082527265471442118331553"; // SHA256 of VS09091615!
  const secretSalt = env.VITE_SECRET_SALT || "UCH_2025_SECURE_SALT_VS";

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
