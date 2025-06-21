# Deploy FoodieID ke Vercel - Panduan Lengkap

## Langkah 1: Persiapan Database
Buat database PostgreSQL gratis di salah satu provider:

### Option A: Neon (Recommended)
1. Kunjungi https://neon.tech
2. Buat akun gratis
3. Buat database baru
4. Copy connection string yang diberikan

### Option B: Supabase 
1. Kunjungi https://supabase.com
2. Buat project baru
3. Ambil connection string dari Settings > Database

## Langkah 2: Install Vercel CLI
```bash
npm install -g vercel
```

## Langkah 3: Login ke Vercel
```bash
vercel login
```

## Langkah 4: Deploy
```bash
vercel --prod
```

## Langkah 5: Setup Environment Variables
Di Vercel Dashboard, tambahkan variables berikut:

**Database:**
- `DATABASE_URL` = connection string dari Neon/Supabase
- `PGHOST` = hostname database
- `PGPORT` = 5432
- `PGDATABASE` = nama database
- `PGUSER` = username database
- `PGPASSWORD` = password database

**App:**
- `NODE_ENV` = production

## Langkah 6: Run Database Migration
Setelah deploy berhasil, jalankan:
```bash
vercel env pull .env.local
npm run db:push
```

## Domain yang Akan Aktif:
- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/*`
- Admin: `https://your-app.vercel.app/admin`

## Fitur yang Akan Berfungsi:
- Landing page dengan semua komponen
- Login system untuk customer/restaurant/driver/admin
- Real-time order tracking
- Payment system (COD & TasPay)
- Maps integration
- Admin dashboard lengkap
- Database PostgreSQL production

## Troubleshooting:
Jika ada error, cek:
1. Environment variables sudah benar
2. Database connection string valid
3. Migration database sudah dijalankan

Aplikasi siap production dengan semua fitur lengkap!