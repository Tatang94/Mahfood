import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working' });
});

// HANYA inisialisasi satu kali saat serverless function dipanggil
let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    isInitialized = true;
  }

  // Gunakan handler Express
  return app(req, res);
}
