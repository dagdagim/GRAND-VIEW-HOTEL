import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentGatewayStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentProvider = 
  | 'CASH'
  | 'CREDIT_CARD'
  | 'CHAPA'
  | 'TELEBIRR'
  | 'BANK_TRANSFER'
  | 'STRIPE';

export interface IPayment extends Document {
  transactionId: string;
  folio: Types.ObjectId;
  reservation: Types.ObjectId;
  guest: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: PaymentProvider;
  status: PaymentGatewayStatus;
  providerReference?: string;
  notes?: string;
  processedBy?: Types.ObjectId;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    transactionId: { type: String, required: true, unique: true, uppercase: true, index: true },
    folio: { type: Schema.Types.ObjectId, ref: 'Folio', required: true, index: true },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'ETB' },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_CARD', 'CHAPA', 'TELEBIRR', 'BANK_TRANSFER', 'STRIPE'],
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    providerReference: { type: String },
    notes: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
