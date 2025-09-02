import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/adapter-netlify').Config} */
const config = { 
  kit: { 
    adapter: adapter({
      // Konfigurasi untuk Netlify
      edge: false,
      split: false,
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
