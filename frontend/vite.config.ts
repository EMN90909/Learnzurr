
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/src/lib/creation/')) return 'studio-tools';
        }
      }
    }
  },
  esbuild: { legalComments: 'none', treeShaking: true },
  server: { host: '0.0.0.0', port: 3000 }
});
