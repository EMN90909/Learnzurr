import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [sveltekit()], build: { cssCodeSplit: true }, server: { port: 5173 } });
