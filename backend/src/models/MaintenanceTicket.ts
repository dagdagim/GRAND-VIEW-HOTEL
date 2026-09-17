import mongoose, { Schema, Document, Types } from 'mongoose';

export type MaintenanceCategory = 
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'HVAC'
  | 'FURNITURE'
  | 'KEY_LOCK'
  | 'ELECTRONICS'
  | 'STRUCTURAL'
  | 'OTHER';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MaintenanceStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export interface IMaintenanceTicket extends Document {
  ticketNumber: string;
  room?: Types.ObjectId;
  facilityArea?: string;
  issueTitle: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  blockRoomFromBooking: boolean;
  reportedBy?: Types.ObjectId;
  reportedByName?: string;
  assignedTo?: Types.ObjectId;
  resolutionNotes?: string;
  cost?: number;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceTicketSchema = new Schema<IMaintenanceTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true, uppercase: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', index: true },
    facilityArea: { type: String },
    issueTitle: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['PLUMBING', 'ELECTRICAL', 'HVAC', 'FURNITURE', 'KEY_LOCK', 'ELECTRONICS', 'STRUCTURAL', 'OTHER'],
      default: 'PLUMBING'
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true
    },
    blockRoomFromBooking: { type: Boolean, default: false },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    reportedByName: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String },
    cost: { type: Number, default: 0 },
    resolvedAt: { type: Date },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

export const MaintenanceTicket = mongoose.model<IMaintenanceTicket>('MaintenanceTicket', MaintenanceTicketSchema);
