@echo off
echo ============================================
echo   DEPLOY DASHBOARD RAYHAR KE NETLIFY
echo ============================================
echo.
echo Pastikan folder .svelte-kit/netlify sudah ada
echo.
if not exist ".svelte-kit\netlify" (
    echo ❌ Folder .svelte-kit/netlify tidak ditemukan!
    echo Jalankan 'npm run build' terlebih dahulu.
    pause
    exit /b 1
)

echo ✅ Folder .svelte-kit/netlify ditemukan
echo.
echo 📁 Isi folder build:
dir ".svelte-kit\netlify" /b
echo.
echo 🚀 LANGKAH DEPLOYMENT:
echo 1. Buka Netlify Dashboard
echo 2. Pilih project dashboard-admin-rayhar
echo 3. Klik "Deploy manually"
echo 4. Upload isi folder .svelte-kit/netlify
echo 5. Pastikan file _redirects dan _headers ikut terupload
echo.
echo 📋 FILE PENTING YANG HARUS ADA:
echo - _redirects (untuk routing SPA)
echo - _headers (untuk keamanan)
echo - index.html (halaman utama)
echo - _app/ (folder assets)
echo.
echo 🔧 JIKA MASIH ERROR:
echo 1. Pastikan Node.js version 20+ di Netlify
echo 2. Cek build logs untuk error
echo 3. Pastikan semua file terupload dengan benar
echo.
pause
