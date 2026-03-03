import { defineConfig } from 'vite';

export default defineConfig({
  base: '/NuclearSim/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
