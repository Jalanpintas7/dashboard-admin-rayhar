import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/adapter-netlify').Config} */
const config = { 
  kit: { 
    adapter: adapter({
      // Konfigurasi untuk Netlify
      edge: false,
      split: false
    }) 
  } 
};

export default config;
