import dns from 'node:dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: true, // Allow frontend dev server and public visitors
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serverless DB connection middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Mount API routes
app.use('/api', apiRoutes);

// Root route & Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Grand View Hotel PMS & Booking Engine API',
    timestamp: new Date()
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Grand View Hotel PMS & Booking Engine API',
    timestamp: new Date()
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] Hotel PMS Backend running on http://localhost:${PORT}`);
  });
}

export default app;
