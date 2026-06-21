import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/backgrounds/themes/')) return 'bg-themes';
          if (id.includes('/visuals/'))            return 'visuals';
          if (id.includes('/arcade/'))             return 'arcade';
        },
      },
    },
  },
});
