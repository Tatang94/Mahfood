import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    await registerRoutes(app);
    isInitialized = true;
  }
  return app(req, res);
}