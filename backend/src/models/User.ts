import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'HOTEL_MANAGER'
  | 'RECEPTIONIST'
  | 'ACCOUNTANT'
  | 'HOUSEKEEPER'
  | 'HOUSEKEEPING'
  | 'MAINTENANCE'
  | 'RESTAURANT_STAFF';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: [
        'SUPER_ADMIN',
        'HOTEL_MANAGER',
        'RECEPTIONIST',
        'ACCOUNTANT',
        'HOUSEKEEPER',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'RESTAURANT_STAFF'
      ],
      default: 'RECEPTIONIST'
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
