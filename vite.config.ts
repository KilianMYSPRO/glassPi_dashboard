import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Ensures assets load correctly regardless of path/subdirectory
    server: {
      allowedHosts: ['dashboard.home'],
      port: 3002,
      host: true, // Listen on all addresses (0.0.0.0)
      proxy: {
        '/adguard-api': {
          target: 'http://adguard.home',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/adguard-api/, ''),
          secure: false,
        },
        '/speedtest-api': {
          target: 'http://speedometer.home',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/speedtest-api/, ''),
          secure: false,
        },
        // Optional: Proxy Glances if CORS issues arise
        '/glances-api': {
          target: 'http://glances.home',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/glances-api/, ''),
          secure: false,
        },
        '/kuma-api': {
          target: process.env.VITE_KUMA_URL || 'http://kuma.home', // Fallback if env not loaded here, but better to rely on .env
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kuma-api/, ''),
          secure: false,
        }
      },
    },
    plugins: [react()],
    define: {
      // Expose env vars safely to the client
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});