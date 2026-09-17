import mongoose, { Schema, Document, Types } from 'mongoose';

export type HousekeepingStage = 
  | 'DIRTY'
  | 'ASSIGNED'
  | 'CLEANING'
  | 'INSPECTED'
  | 'READY';

export type HousekeepingPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type HousekeepingTaskType = 
  | 'DEPARTURE_CLEAN'
  | 'STAYOVER_CLEAN'
  | 'TOUCH_UP'
  | 'DEEP_CLEAN'
  | 'TURNDOWN';

export interface IHousekeepingTask extends Document {
  taskNumber: string;
  room: Types.ObjectId;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriority;
  stage: HousekeepingStage;
  assignedStaff?: Types.ObjectId;
  inspectedBy?: Types.ObjectId;
  guestServiceRequest?: Types.ObjectId;
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
  inspectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HousekeepingTaskSchema = new Schema<IHousekeepingTask>(
  {
    taskNumber: { type: String, required: true, unique: true, uppercase: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    taskType: {
      type: String,
      enum: ['DEPARTURE_CLEAN', 'STAYOVER_CLEAN', 'TOUCH_UP', 'DEEP_CLEAN', 'TURNDOWN'],
      default: 'DEPARTURE_CLEAN'
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    stage: {
      type: String,
      enum: ['DIRTY', 'ASSIGNED', 'CLEANING', 'INSPECTED', 'READY'],
      default: 'DIRTY',
      index: true
    },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'User' },
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    guestServiceRequest: { type: Schema.Types.ObjectId, ref: 'GuestServiceRequest', index: true },
    notes: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    inspectedAt: { type: Date }
  },
  { timestamps: true }
);

export const HousekeepingTask = mongoose.model<IHousekeepingTask>('HousekeepingTask', HousekeepingTaskSchema);
