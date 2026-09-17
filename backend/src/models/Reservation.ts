import mongoose, { Schema, Document, Types } from 'mongoose';

export type BookingSource = 
  | 'WEBSITE'
  | 'WALK_IN'
  | 'PHONE'
  | 'EMAIL'
  | 'TRAVEL_AGENT'
  | 'CORPORATE'
  | 'OTHER';

export type ReservationStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus = 
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod = 
  | 'CASH'
  | 'CREDIT_CARD'
  | 'CHAPA'
  | 'TELEBIRR'
  | 'BANK_TRANSFER'
  | 'PAY_AT_HOTEL';

export interface IReservation extends Document {
  bookingNumber: string;
  source: BookingSource;
  guest: Types.ObjectId;
  roomType: Types.ObjectId;
  assignedRoom?: Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  pricing: {
    roomRatePerNight: number;
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    total: number;
    paidAmount: number;
    balance: number;
  };
  specialRequests?: string;
  arrivalTime?: string;
  promoCode?: string;
  paymentGatewayReference?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  stayRef?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    bookingNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    source: {
      type: String,
      enum: ['WEBSITE', 'WALK_IN', 'PHONE', 'EMAIL', 'TRAVEL_AGENT', 'CORPORATE', 'OTHER'],
      default: 'WEBSITE',
      index: true
    },
    guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    assignedRoom: { type: Schema.Types.ObjectId, ref: 'Room', index: true },
    checkInDate: { type: Date, required: true, index: true },
    checkOutDate: { type: Date, required: true, index: true },
    nights: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1, default: 1 },
    children: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'],
      default: 'CONFIRMED',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_CARD', 'CHAPA', 'TELEBIRR', 'BANK_TRANSFER', 'PAY_AT_HOTEL'],
      default: 'PAY_AT_HOTEL'
    },
    pricing: {
      roomRatePerNight: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true, default: 0 },
      serviceCharge: { type: Number, required: true, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      paidAmount: { type: Number, default: 0 },
      balance: { type: Number, required: true }
    },
    specialRequests: { type: String },
    arrivalTime: { type: String, default: '14:00' },
    promoCode: { type: String },
    paymentGatewayReference: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    stayRef: { type: Schema.Types.ObjectId, ref: 'Stay' }
  },
  { timestamps: true }
);

ReservationSchema.index({ checkInDate: 1, checkOutDate: 1, status: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);
