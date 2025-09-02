import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = { 
  kit: { 
    adapter: adapter({
      // Konfigurasi untuk SPA mode
      edge: false,
      split: false,
      // Nonaktifkan serverless functions untuk SPA
      functions: false
    }),
    // Konfigurasi untuk SPA routing
    prerender: {
      handleHttpError: 'warn',
      // Pastikan semua route di-prerender
      entries: ['*']
    }
  } 
};

export default config;
