import adapter from '@sveltejs/adapter-node';
const config = { kit: { adapter: adapter(), serviceWorker: { register: true } } };
export default config;
