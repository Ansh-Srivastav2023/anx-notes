import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/anx-notes/',
  root: __dirname,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});