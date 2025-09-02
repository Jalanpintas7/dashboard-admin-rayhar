import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/adapter-netlify').Config} */
const config = { 
  kit: {
    adapter: adapter({
      // Konfigurasi untuk Netlify - SPA mode only
      edge: false,
      split: false,
      // Nonaktifkan serverless functions untuk SPA
      functions: false,
      // Pastikan semua route di-handle dengan benar
      fallback: 'index.html'
    }),
    // Konfigurasi untuk prerendering
    prerender: {
      handleHttpError: 'warn'
    }
  } 
};

export default config;
