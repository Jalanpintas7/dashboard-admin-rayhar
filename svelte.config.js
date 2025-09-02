import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Konfigurasi untuk static export
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
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
