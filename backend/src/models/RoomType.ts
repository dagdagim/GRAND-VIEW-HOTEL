import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomType extends Document {
  code: string;
  name: string;
  category: 'Single' | 'Double' | 'Twin' | 'Deluxe' | 'Suite' | 'Family' | 'Presidential';
  description: string;
  shortDescription: string;
  basePrice: number; // per night
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedType: string;
  sizeSquareMeters: number;
  amenities: string[];
  features: string[];
  mealPlan: string;
  cancellationPolicy: string;
  images: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Single', 'Double', 'Twin', 'Deluxe', 'Suite', 'Family', 'Presidential'],
      required: true
    },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    maxAdults: { type: Number, required: true, default: 2, min: 1 },
    maxChildren: { type: Number, default: 1, min: 0 },
    maxOccupancy: { type: Number, required: true, default: 2 },
    bedType: { type: String, required: true },
    sizeSquareMeters: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    features: { type: [String], default: [] },
    mealPlan: { type: String, default: 'Breakfast Included' },
    cancellationPolicy: { type: String, default: 'Free cancellation up to 48 hours before check-in' },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const RoomType = mongoose.model<IRoomType>('RoomType', RoomTypeSchema);
