import mongoose, { Schema, Document, Types } from 'mongoose';

export type FolioItemCategory = 
  | 'ROOM_CHARGE'
  | 'RESTAURANT'
  | 'ROOM_SERVICE'
  | 'MINIBAR'
  | 'LAUNDRY'
  | 'SPA'
  | 'TRANSPORT'
  | 'OTHER';

export interface IFolioItem {
  _id?: Types.ObjectId;
  date: Date;
  category: FolioItemCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  referenceId?: string; // e.g. Restaurant Order ID
  postedBy?: Types.ObjectId;
}

export interface IFolio extends Document {
  folioNumber: string;
  stay?: Types.ObjectId;
  reservation: Types.ObjectId;
  guest: Types.ObjectId;
  room?: Types.ObjectId;
  items: IFolioItem[];
  payments: Types.ObjectId[];
  subtotal: number;
  taxTotal: number;
  serviceChargeTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidTotal: number;
  balance: number;
  status: 'OPEN' | 'CLOSED' | 'SETTLED';
  closedAt?: Date;
  recalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FolioItemSchema = new Schema<IFolioItem>({
  date: { type: Date, default: Date.now },
  category: {
    type: String,
    enum: ['ROOM_CHARGE', 'RESTAURANT', 'ROOM_SERVICE', 'MINIBAR', 'LAUNDRY', 'SPA', 'TRANSPORT', 'OTHER'],
    required: true
  },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true, default: 0 },
  serviceCharge: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  referenceId: { type: String },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

const FolioSchema = new Schema<IFolio>(
  {
    folioNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    stay: { type: Schema.Types.ObjectId, ref: 'Stay' },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    items: [FolioItemSchema],
    payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    subtotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    serviceChargeTotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paidTotal: { type: Number, required: true, default: 0 },
    balance: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'SETTLED'],
      default: 'OPEN',
      index: true
    },
    closedAt: Date,
    recalculatedAt: Date
  },
  { timestamps: true }
);

export const Folio = mongoose.model<IFolio>('Folio', FolioSchema);
