# Deploy FoodieID ke Vercel

## Langkah-langkah Deployment:

### 1. Persiapan
```bash
npm install -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```

### 3. Setup Environment Variables
Di Vercel Dashboard, tambahkan environment variables:
- `DATABASE_URL` - Connection string PostgreSQL Anda
- `PGHOST` - Host database
- `PGPORT` - Port database (biasanya 5432)
- `PGDATABASE` - Nama database
- `PGUSER` - Username database
- `PGPASSWORD` - Password database
- `NODE_ENV` - production

### 4. Deploy
```bash
vercel --prod
```

## Konfigurasi Database

### Untuk PostgreSQL External:
1. Buat database PostgreSQL di:
   - **Neon** (gratis): https://neon.tech
   - **Supabase** (gratis): https://supabase.com
   - **Railway** (gratis): https://railway.app
   - **PlanetScale** (gratis): https://planetscale.com

2. Dapatkan connection string dan masukkan ke environment variables

### Migration Database:
```bash
npm run db:push
```

## Struktur File untuk Vercel:
- `/api/index.ts` - Serverless function entry point
- `/vercel.json` - Konfigurasi Vercel
- `/client/dist/` - Static files frontend

## Custom Domain (Opsional):
1. Beli domain di provider (Namecheap, GoDaddy, dll)
2. Tambahkan di Vercel Dashboard > Domains
3. Update DNS records sesuai instruksi Vercel

## Monitoring:
- Logs tersedia di Vercel Dashboard
- Real-time monitoring untuk errors
- Analytics untuk traffic

Aplikasi akan tersedia di: `https://your-project-name.vercel.app`