import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working' });
});

const handler = serverless(app);
export default handler;
