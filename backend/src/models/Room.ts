import mongoose, { Schema, Document, Types } from 'mongoose';

export type RoomOperationalStatus = 
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'CLEANING'
  | 'DIRTY'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type RoomCleanlinessStatus = 'CLEAN' | 'DIRTY' | 'INSPECTED';

export interface IRoom extends Document {
  roomNumber: string;
  floor: number;
  roomType: Types.ObjectId;
  status: RoomOperationalStatus;
  cleanStatus: RoomCleanlinessStatus;
  currentStay?: Types.ObjectId;
  currentReservation?: Types.ObjectId;
  keyCardCode?: string;
  isSmoking: boolean;
  connectingRoom?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    floor: { type: Number, required: true },
    roomType: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'DIRTY', 'MAINTENANCE', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE',
      index: true
    },
    cleanStatus: {
      type: String,
      enum: ['CLEAN', 'DIRTY', 'INSPECTED'],
      default: 'CLEAN',
      index: true
    },
    currentStay: { type: Schema.Types.ObjectId, ref: 'Stay' },
    currentReservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    keyCardCode: { type: String },
    isSmoking: { type: Boolean, default: false },
    connectingRoom: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

RoomSchema.index({ floor: 1, status: 1 });
RoomSchema.index({ roomType: 1, status: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
