import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStay extends Document {
  reservation: Types.ObjectId;
  guest: Types.ObjectId;
  room: Types.ObjectId;
  roomType: Types.ObjectId;
  checkInTime: Date;
  scheduledCheckOut: Date;
  actualCheckOutTime?: Date;
  keyCardsIssued: number;
  roomHistory: Array<{
    room: Types.ObjectId;
    from: Date;
    to?: Date;
    reason: string;
    changedBy?: Types.ObjectId;
  }>;
  folio: Types.ObjectId;
  status: 'IN_HOUSE' | 'CHECKED_OUT';
  guestAccessCode?: string;
  guestAccessCodeExpiresAt?: Date;
  doNotDisturb?: boolean;
  dayFinished?: boolean;
  dayFinishedAt?: Date;
  wakeUpCallTime?: string;
  turndownRequested?: boolean;
  breakfastPreference?: string;
  dayFinishedNotes?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaySchema = new Schema<IStay>(
  {
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
    checkInTime: { type: Date, required: true, default: Date.now },
    scheduledCheckOut: { type: Date, required: true },
    actualCheckOutTime: { type: Date },
    keyCardsIssued: { type: Number, default: 1 },
    roomHistory: [
      {
        room: { type: Schema.Types.ObjectId, ref: 'Room' },
        from: { type: Date, default: Date.now },
        to: { type: Date },
        reason: { type: String },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    folio: { type: Schema.Types.ObjectId, ref: 'Folio' },
    status: {
      type: String,
      enum: ['IN_HOUSE', 'CHECKED_OUT'],
      default: 'IN_HOUSE',
      index: true
    },
    guestAccessCode: { type: String, index: true },
    guestAccessCodeExpiresAt: { type: Date },
    doNotDisturb: { type: Boolean, default: false },
    dayFinished: { type: Boolean, default: false },
    dayFinishedAt: { type: Date },
    wakeUpCallTime: { type: String },
    turndownRequested: { type: Boolean, default: false },
    breakfastPreference: { type: String },
    dayFinishedNotes: { type: String },
    notes: String
  },
  { timestamps: true }
);

export const Stay = mongoose.model<IStay>('Stay', StaySchema);
