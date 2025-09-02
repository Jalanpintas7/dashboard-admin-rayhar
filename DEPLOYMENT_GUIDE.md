# Panduan Deployment ke Netlify

## Persiapan Deployment

### 1. Pastikan Dependencies Terinstall
```bash
npm install
```

### 2. Test Build Lokal
```bash
npm run build:netlify
```

### 3. Preview Build Lokal (Opsional)
```bash
npm run preview
```

## Deployment ke Netlify

### Opsi 1: Deployment Otomatis via Git
1. Push kode ke repository GitHub/GitLab
2. Connect repository ke Netlify
3. Netlify akan otomatis build dan deploy

### Opsi 2: Deployment Manual via CLI
```bash
# Install Netlify CLI (jika belum)
npm install -g netlify-cli

# Login ke Netlify
netlify login

# Deploy preview
npm run deploy:preview

# Deploy production
npm run deploy:prod
```

### Opsi 3: Drag & Drop
1. Jalankan `npm run build:netlify`
2. Drag folder `build` ke Netlify dashboard

## Konfigurasi Netlify

### Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node version**: `20`

### Environment Variables (jika diperlukan)
Tambahkan di Netlify dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### Masalah Routing (Page Not Found)
✅ Sudah diperbaiki dengan konfigurasi:
- `_redirects` file
- `netlify.toml` redirects
- Svelte adapter configuration

### Build Errors
1. Pastikan Node.js version 20
2. Clear cache: `npm run build -- --force`
3. Delete `node_modules` dan `npm install` ulang

### Performance Issues
✅ Sudah dioptimasi dengan:
- Cache headers
- Static file optimization
- Build splitting

## File Konfigurasi Penting

- `netlify.toml` - Konfigurasi build dan redirects
- `_redirects` - Fallback routing untuk SPA
- `svelte.config.js` - Svelte adapter configuration
- `package.json` - Build scripts

## Testing Setelah Deployment

1. Test semua route utama:
   - `/` (home)
   - `/login`
   - `/pelanggan`
   - `/dataumrah`
   - `/inputumrah`
   - dll.

2. Test reload pada setiap halaman
3. Test navigasi antar halaman
4. Test responsive design

## Support

Jika ada masalah deployment, periksa:
1. Netlify build logs
2. Browser console errors
3. Network tab untuk failed requests
