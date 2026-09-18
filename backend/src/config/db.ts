import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PRIMARY_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@127.0.0.1:27017/hotel_pms?authSource=admin';
const LOCAL_FALLBACK_URI = 'mongodb://admin:password123@127.0.0.1:27017/hotel_pms?authSource=admin';

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const isCloudUri = process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb+srv://');

  try {
    const maskedUri = PRIMARY_URI.includes('@') ? PRIMARY_URI.split('@')[1] : PRIMARY_URI;
    console.log(`[Database] Attempting connection to MongoDB: ${maskedUri}...`);
    await mongoose.connect(PRIMARY_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[Database] Connected successfully to MongoDB.`);
    return;
  } catch (primaryErr: any) {
    console.error(`[Database] MongoDB connection failed: ${primaryErr.message}`);

    // If on production / cloud, do NOT attempt localhost 127.0.0.1 fallback
    if (process.env.NODE_ENV === 'production' || isCloudUri) {
      console.error(`[Database] Notice: When using MongoDB Atlas on Render, make sure to:`);
      console.error(` 1. In MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).`);
      console.error(` 2. Verify database username and password in MONGODB_URI.`);
      // Retry in 10 seconds without crashing the server process
      setTimeout(() => {
        console.log(`[Database] Retrying MongoDB connection...`);
        connectDB();
      }, 10000);
      return;
    }

    // Fallback to local Docker MongoDB only in local development
    try {
      console.warn(`[Database] Switching to local Docker fallback (${LOCAL_FALLBACK_URI})...`);
      await mongoose.connect(LOCAL_FALLBACK_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[Database] Connected successfully to local fallback MongoDB.`);
    } catch (fallbackErr: any) {
      console.error('[Database] Local fallback MongoDB connection also failed:', fallbackErr);
    }
  }
}
