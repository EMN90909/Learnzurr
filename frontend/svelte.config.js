
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  compilerOptions: { dev: false },
  kit: {
    adapter: adapter({ out: 'build' }),
    serviceWorker: { register: true },
    inlineStyleThreshold: 4096,
    version: { pollInterval: 600000 }
  }
};

export default config;
