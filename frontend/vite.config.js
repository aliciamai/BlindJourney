import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/localStorage.setup.js', './src/test/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        '**/main.jsx',
        '**/App.jsx',
        '**/i18n/index.js',
        '**/theme/theme.js',
      ],
      thresholds: { branches: 85, functions: 89, lines: 95, statements: 94 },
      reporter: ['text', 'lcov'],
    },
  },
});
