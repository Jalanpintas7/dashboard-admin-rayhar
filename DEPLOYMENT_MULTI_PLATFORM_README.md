# Panduan Deployment Multi-Platform

## 🎯 Masalah yang Ditemukan & Diperbaiki

### ❌ Masalah Sebelumnya:
1. **Netlify**: Page not found karena index.html tidak dihasilkan
2. **Vercel**: Error "No Output Directory named 'public'" karena adapter tidak sesuai

### ✅ Solusi yang Diterapkan:
1. **Konfigurasi adapter-netlify diperbaiki** untuk menghasilkan index.html
2. **Adapter-vercel ditambahkan** untuk deployment ke Vercel
3. **Konfigurasi khusus** untuk setiap platform

## 🚀 Deployment ke Netlify

### Persiapan:
```bash
# Install dependencies
npm install

# Build untuk Netlify
npm run build:netlify
```

### Deploy via Git (Otomatis):
1. Push kode ke GitHub/GitLab
2. Hubungkan repository ke Netlify
3. Netlify akan build otomatis dengan konfigurasi:
   - **Build command**: `npm run build`
   - **Publish directory**: `.svelte-kit/netlify`
   - **Node version**: `20`

### Deploy Manual:
```bash
# Preview deploy
npm run deploy:preview

# Production deploy
npm run deploy:prod
```

## 🚀 Deployment ke Vercel

### Persiapan:
```bash
# Build untuk Vercel (akan mengganti svelte.config.js)
npm run build:vercel

# Install Vercel CLI (jika belum)
npm i -g vercel
```

### Deploy via Git (Otomatis):
1. Push kode ke GitHub
2. Hubungkan repository ke Vercel
3. Vercel akan menggunakan `vercel.json` untuk konfigurasi

### Deploy Manual:
```bash
# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

## ⚙️ Konfigurasi File

### `svelte.config.js` (Default - Netlify)
```javascript
import adapter from '@sveltejs/adapter-netlify';
```

### `svelte.config.vercel.js` (Untuk Vercel)
```javascript
import adapter from '@sveltejs/adapter-vercel';
```

### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".vercel/output",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".svelte-kit/netlify"

[build.environment]
  NODE_VERSION = "20"
```

## 🐛 Troubleshooting

### Netlify Issues:
- **Page not found**: Pastikan publish directory adalah `.svelte-kit/netlify`
- **Build error**: Cek Node version (harus 20+)
- **Assets tidak load**: Cek file `_headers` di publish directory

### Vercel Issues:
- **Missing public directory**: Gunakan `npm run build:vercel` untuk build
- **Routing error**: Cek `vercel.json` rewrites configuration
- **Build error**: Pastikan adapter-vercel terinstall

## ✅ Test Setelah Deployment

### Test Routing:
- `/` (home)
- `/login`
- `/pelanggan`
- `/dataumrah`
- `/inputumrah`

### Test Features:
- Navigation antar halaman
- Form submission
- Responsive design
- Logo dan assets loading

## 📝 Catatan Penting

1. **Selalu gunakan script yang sesuai**:
   - Netlify: `npm run build:netlify`
   - Vercel: `npm run build:vercel`

2. **Environment Variables**:
   - Pastikan set di dashboard masing-masing platform
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Node Version**:
   - Netlify: Set 20 di `netlify.toml`
   - Vercel: Auto-detect dari `package.json`

## 🎉 Kedua Platform Sekarang Siap!

Dengan konfigurasi ini, aplikasi bisa di-deploy ke **Netlify** dan **Vercel** tanpa masalah! 🚀
