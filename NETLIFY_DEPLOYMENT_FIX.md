# 🔧 Fix Error "Page Not Found" di Netlify

## Masalah yang Ditemukan
Error "Page Not Found" terjadi setelah deploy ke Netlify karena:
1. **Konfigurasi SvelteKit tidak sesuai** untuk SPA mode
2. **File `_redirects` tidak lengkap** untuk semua route
3. **Publish directory salah** di netlify.toml
4. **Functions tidak diperlukan** untuk SPA mode

## Solusi yang Diterapkan

### 1. Update `svelte.config.js`
```javascript
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
```

### 2. Update `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".svelte-kit/output/client"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

# Nonaktifkan functions untuk SPA mode
# [functions]
#   directory = ".netlify/functions"
#   node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/_app/immutable/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 3. Update `build/_redirects`
```apache
# Redirect semua route ke index.html untuk SPA routing
/*    /index.html   200

# Redirect spesifik untuk route yang ada
/login    /index.html   200
/register    /index.html   200
/forgot-password    /index.html   200
/reset-password    /index.html   200
/DashboardBranch    /index.html   200
/DashboardBranch/*    /index.html   200
/Pelanggan    /index.html   200
/Pelanggan/*    /index.html   200
/InputUmrah    /index.html   200
/InputUmrah/*    /index.html   200
/DataUmrah    /index.html   200
/DataUmrah/*    /index.html   200
/InputDestinasi    /index.html   200
/InputDestinasi/*    /index.html   200
/DataDestinasi    /index.html   200
/DataDestinasi/*    /index.html   200
/InputAirline    /index.html   200
/InputAirline/*    /index.html   200
/InputAirline&SalesConsultant    /index.html   200
/InputAirline&SalesConsultant/*    /index.html   200

# Fallback untuk semua route lainnya
/*    /index.html   200
```

### 4. Update Scripts di `package.json`
```json
{
  "scripts": {
    "build:netlify": "npm run build && copy build\\_redirects .svelte-kit\\output\\client\\_redirects && copy build\\_headers .svelte-kit\\output\\client\\_headers && echo 'Build completed successfully for Netlify deployment'",
    "deploy:preview": "npm run build:netlify && netlify deploy --dir=.svelte-kit/output/client",
    "deploy:prod": "npm run build:netlify && netlify deploy --prod --dir=.svelte-kit/output/client"
  }
}
```

## Cara Deploy

### Deploy Preview
```bash
npm run deploy:preview
```

### Deploy Production
```bash
npm run deploy:prod
```

## Perubahan Utama

1. **Publish Directory**: Dari `build` ke `.svelte-kit/output/client`
2. **Konfigurasi Adapter**: Menggunakan SPA mode dengan `functions: false`
3. **File Redirects**: Lengkap dengan semua route dan wildcard
4. **Scripts**: Otomatis copy file penting ke output directory

## Testing

Setelah deploy, test semua route:
- ✅ `/` (Dashboard utama)
- ✅ `/login`
- ✅ `/DashboardBranch`
- ✅ `/Pelanggan`
- ✅ `/InputUmrah`
- ✅ `/DataUmrah`
- ✅ `/InputDestinasi`
- ✅ `/DataDestinasi`
- ✅ `/InputAirline`

## Troubleshooting

Jika masih ada error:
1. **Clear Netlify cache** dan redeploy
2. **Check Netlify logs** untuk error detail
3. **Verify file `_redirects`** sudah ter-copy dengan benar
4. **Test local** dengan `npm run preview`

## Catatan Penting

- **SPA Mode**: Aplikasi berjalan di client-side, tidak memerlukan serverless functions
- **Prerendering**: Semua route di-prerender untuk performa optimal
- **Caching**: File static di-cache dengan immutable flag untuk performa
- **Security**: Headers keamanan lengkap untuk production
