import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PRIMARY_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@127.0.0.1:27017/hotel_pms?authSource=admin';
const LOCAL_FALLBACK_URI = 'mongodb://admin:password123@127.0.0.1:27017/hotel_pms?authSource=admin';

export async function connectDB(): Promise<void> {
  // First attempt primary URI
  try {
    console.log(`[Database] Attempting connection to primary MongoDB: ${PRIMARY_URI.includes('@') ? PRIMARY_URI.split('@')[1] : PRIMARY_URI}...`);
    await mongoose.connect(PRIMARY_URI, {
      serverSelectionTimeoutMS: 5000 // 5s timeout to not hang
    });
    console.log(`[Database] Connected successfully to primary MongoDB.`);
    return;
  } catch (primaryErr: any) {
    console.warn(`[Database] Primary MongoDB connection failed (${primaryErr.message}). Switching to local fallback...`);
  }

  // Fallback to local Docker MongoDB
  try {
    await mongoose.connect(LOCAL_FALLBACK_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] Connected successfully to local fallback MongoDB (${LOCAL_FALLBACK_URI}).`);
  } catch (fallbackErr: any) {
    console.error('[Database] Both primary and fallback MongoDB connections failed:', fallbackErr);
    process.exit(1);
  }
}
