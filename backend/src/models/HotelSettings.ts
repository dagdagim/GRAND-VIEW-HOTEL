import mongoose, { Schema, Document } from 'mongoose';

export interface IHotelSettings extends Document {
  hotelName: string;
  legalName?: string;
  tagline: string;
  description: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    subCity?: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    supportEmail?: string;
  };
  operational: {
    checkInTime: string; // e.g. "14:00"
    checkOutTime: string; // e.g. "11:00"
    bookingPolicy: string;
    cancellationPolicy: string;
    maxGuestsPerBooking: number;
  };
  finance: {
    currency: string; // "ETB"
    currencySymbol: string; // "ETB"
    taxRate: number; // e.g. 0.15 (15% VAT)
    serviceChargeRate: number; // e.g. 0.10 (10%)
    acceptedPaymentMethods: string[];
    chapaEnabled: boolean;
    telebirrEnabled: boolean;
    stripeEnabled: boolean;
  };
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HotelSettingsSchema = new Schema<IHotelSettings>(
  {
    hotelName: { type: String, required: true, default: 'Grand View Hotel & Suites' },
    legalName: { type: String, default: 'Grand View Hospitality PLC' },
    tagline: { type: String, default: 'Your stay, thoughtfully made.' },
    description: { 
      type: String, 
      default: 'A premier luxury destination offering world-class comfort, exquisite dining, panoramic views, and unmatched Ethiopian hospitality.' 
    },
    logo: { type: String, default: '/images/hotel-logo.svg' },
    address: {
      street: { type: String, default: 'Cameroon Street, Bole Sub-City' },
      city: { type: String, default: 'Addis Ababa' },
      subCity: { type: String, default: 'Bole' },
      country: { type: String, default: 'Ethiopia' },
      zipCode: { type: String, default: '1000' }
    },
    contact: {
      phone: { type: String, default: '+251 11 667 8000' },
      email: { type: String, default: 'reservations@grandviewhotel.com' },
      website: { type: String, default: 'https://grandviewhotel.et' },
      supportEmail: { type: String, default: 'concierge@grandviewhotel.com' }
    },
    operational: {
      checkInTime: { type: String, default: '14:00' },
      checkOutTime: { type: String, default: '11:00' },
      bookingPolicy: { 
        type: String, 
        default: 'Guaranteed reservations require valid identification upon check-in. Government issued photo ID or passport required.' 
      },
      cancellationPolicy: { 
        type: String, 
        default: 'Free cancellation up to 48 hours prior to arrival date. Late cancellations or no-shows incur 1 night room charge.' 
      },
      maxGuestsPerBooking: { type: Number, default: 8 }
    },
    finance: {
      currency: { type: String, default: 'ETB' },
      currencySymbol: { type: String, default: 'ETB' },
      taxRate: { type: Number, default: 0.15 },
      serviceChargeRate: { type: Number, default: 0.10 },
      acceptedPaymentMethods: { 
        type: [String], 
        default: ['CASH', 'CREDIT_CARD', 'CHAPA', 'TELEBIRR', 'BANK_TRANSFER'] 
      },
      chapaEnabled: { type: Boolean, default: true },
      telebirrEnabled: { type: Boolean, default: true },
      stripeEnabled: { type: Boolean, default: false }
    },
    features: {
      type: [String],
      default: [
        'Heated Infinity Pool',
        'Zoma Wellness & Spa',
        'Abyssinia Fine Dining Restaurant',
        '24/7 Executive Business Lounge',
        'Complimentary Airport Shuttle',
        'High-Speed Wi-Fi 6',
        'Rooftop Terrace & Bar',
        'State-of-the-Art Fitness Center'
      ]
    }
  },
  { timestamps: true }
);

export const HotelSettings = mongoose.model<IHotelSettings>('HotelSettings', HotelSettingsSchema);
