import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    details: { type: String },
    ipAddress: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export type NotificationType = 
  | 'NEW_ONLINE_BOOKING'
  | 'PAYMENT_RECEIVED'
  | 'BOOKING_CANCELLED'
  | 'UPCOMING_ARRIVAL'
  | 'UPCOMING_DEPARTURE'
  | 'ROOM_READY'
  | 'MAINTENANCE_ALERT'
  | 'ROOM_CHARGED'
  | 'GUEST_DAY_FINISHED';

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  referenceModel?: string;
  targetRoles: string[];
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'NEW_ONLINE_BOOKING',
        'PAYMENT_RECEIVED',
        'BOOKING_CANCELLED',
        'UPCOMING_ARRIVAL',
        'UPCOMING_DEPARTURE',
        'ROOM_READY',
        'MAINTENANCE_ALERT',
        'ROOM_CHARGED',
        'GUEST_DAY_FINISHED'
      ],
      required: true
    },
    referenceId: String,
    referenceModel: String,
    targetRoles: { type: [String], default: ['HOTEL_MANAGER', 'RECEPTIONIST'] },
    isRead: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
