import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Konfigurasi untuk Vercel
      runtime: 'nodejs18.x'
    }),
    // Konfigurasi untuk SPA routing
    prerender: {
      handleHttpError: 'warn',
      entries: ['/']
    },
    appDir: '_app'
  }
};

export default config;
