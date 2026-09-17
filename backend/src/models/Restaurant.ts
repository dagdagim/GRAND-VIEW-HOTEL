import mongoose, { Schema, Document, Types } from 'mongoose';

// Restaurant Category
export interface IRestaurantCategory extends Document {
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

const RestaurantCategorySchema = new Schema<IRestaurantCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: String,
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const RestaurantCategory = mongoose.model<IRestaurantCategory>('RestaurantCategory', RestaurantCategorySchema);

// Menu Item
export interface IMenuItem extends Document {
  name: string;
  category: Types.ObjectId;
  description: string;
  price: number;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  dietaryTags: string[];
  image?: string;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'RestaurantCategory', required: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    preparationTimeMinutes: { type: Number, default: 15 },
    dietaryTags: { type: [String], default: [] },
    image: String
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);

// Restaurant Table
export interface IRestaurantTable extends Document {
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  currentOrder?: Types.ObjectId;
}

const RestaurantTableSchema = new Schema<IRestaurantTable>(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, default: 4 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
      default: 'AVAILABLE'
    },
    currentOrder: { type: Schema.Types.ObjectId, ref: 'RestaurantOrder' }
  },
  { timestamps: true }
);

export const RestaurantTable = mongoose.model<IRestaurantTable>('RestaurantTable', RestaurantTableSchema);

// Restaurant Order
export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
export type OrderType = 'DINE_IN' | 'ROOM_SERVICE' | 'TAKEAWAY';

export interface IOrderItem {
  menuItem: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
  preparationTimeMinutes?: number;
}

export interface IRestaurantOrder extends Document {
  orderNumber: string;
  table?: Types.ObjectId;
  orderType: OrderType;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  chargedToRoom: boolean;
  room?: Types.ObjectId;
  stay?: Types.ObjectId;
  guest?: Types.ObjectId;
  folio?: Types.ObjectId;
  paymentMethod?: string;
  serverStaff?: Types.ObjectId;
  notes?: string;
  paidAt?: Date;
  estimatedReadyMinutes?: number;
  estimatedReadyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  specialInstructions: String,
  preparationTimeMinutes: { type: Number, default: 15 }
});

const RestaurantOrderSchema = new Schema<IRestaurantOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true },
    table: { type: Schema.Types.ObjectId, ref: 'RestaurantTable' },
    orderType: {
      type: String,
      enum: ['DINE_IN', 'ROOM_SERVICE', 'TAKEAWAY'],
      default: 'DINE_IN'
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    serviceCharge: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['NEW', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED'],
      default: 'NEW',
      index: true
    },
    chargedToRoom: { type: Boolean, default: false },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    stay: { type: Schema.Types.ObjectId, ref: 'Stay' },
    guest: { type: Schema.Types.ObjectId, ref: 'Guest' },
    folio: { type: Schema.Types.ObjectId, ref: 'Folio' },
    paymentMethod: { type: String },
    serverStaff: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    paidAt: Date,
    estimatedReadyMinutes: { type: Number, default: 20 },
    estimatedReadyAt: { type: Date }
  },
  { timestamps: true }
);

export const RestaurantOrder = mongoose.model<IRestaurantOrder>('RestaurantOrder', RestaurantOrderSchema);
