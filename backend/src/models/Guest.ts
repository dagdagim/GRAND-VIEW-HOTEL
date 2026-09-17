import mongoose, { Schema, Document } from 'mongoose';

export type VipLevel = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface IGuest extends Document {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  nationality: string;
  idType: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE';
  idNumber: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  vipLevel: VipLevel;
  preferences?: {
    dietary?: string;
    bedType?: string;
    floorPreference?: string;
    specialNeeds?: string;
  };
  notes?: string;
  totalStays: number;
  totalSpend: number;
  lastStayDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    secondaryPhone: { type: String, trim: true },
    nationality: { type: String, default: 'Ethiopian' },
    idType: {
      type: String,
      enum: ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'],
      default: 'PASSPORT'
    },
    idNumber: { type: String, default: 'PENDING-REG' },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    vipLevel: {
      type: String,
      enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'STANDARD'
    },
    preferences: {
      dietary: String,
      bedType: String,
      floorPreference: String,
      specialNeeds: String
    },
    notes: String,
    totalStays: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    lastStayDate: Date
  },
  { timestamps: true }
);

GuestSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

GuestSchema.set('toJSON', { virtuals: true });
GuestSchema.set('toObject', { virtuals: true });

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
