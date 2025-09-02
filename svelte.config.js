import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Konfigurasi untuk Netlify deployment
      edge: false,
      split: false
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
