import mongoose, { Schema, Document, Types } from 'mongoose';

export type ServiceRequestCategory = 
  | 'HOUSEKEEPING' 
  | 'MAINTENANCE' 
  | 'CONCIERGE' 
  | 'EXPRESS_CHECKOUT' 
  | 'AMENITIES'
  | 'DAY_FINISHED';

export type ServiceRequestStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface IGuestServiceRequest extends Document {
  requestNumber: string;
  stay: Types.ObjectId;
  room: Types.ObjectId;
  roomNumber: string;
  guest: Types.ObjectId;
  guestName: string;
  category: ServiceRequestCategory;
  item: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: ServiceRequestStatus;
  specialInstructions?: string;
  housekeepingTask?: Types.ObjectId;
  assignedStaff?: Types.ObjectId;
  assignedStaffName?: string;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GuestServiceRequestSchema = new Schema<IGuestServiceRequest>(
  {
    requestNumber: { type: String, required: true, unique: true },
    stay: { type: Schema.Types.ObjectId, ref: 'Stay', required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    roomNumber: { type: String, required: true },
    guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
    guestName: { type: String, required: true },
    category: {
      type: String,
      enum: ['HOUSEKEEPING', 'MAINTENANCE', 'CONCIERGE', 'EXPRESS_CHECKOUT', 'AMENITIES', 'DAY_FINISHED'],
      required: true,
      index: true
    },
    item: { type: String, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    specialInstructions: String,
    housekeepingTask: { type: Schema.Types.ObjectId, ref: 'HousekeepingTask' },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedStaffName: String,
    completedAt: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const GuestServiceRequest = mongoose.model<IGuestServiceRequest>(
  'GuestServiceRequest', 
  GuestServiceRequestSchema
);
