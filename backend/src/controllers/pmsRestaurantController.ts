import { Response } from 'express';
import { 
  RestaurantCategory, 
  MenuItem, 
  RestaurantTable, 
  RestaurantOrder, 
  Room, 
  Stay, 
  Folio 
} from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';
import { FolioService } from '../services/folioService.js';

export const getMenuCatalog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = await RestaurantCategory.find({ isActive: true }).sort({ displayOrder: 1 });
    const items = await MenuItem.find({ isAvailable: true }).populate('category').sort({ name: 1 });
    const tables = await RestaurantTable.find().sort({ tableNumber: 1 });

    res.json({ categories, items, tables });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;

    const orders = await RestaurantOrder.find(filter)
      .populate('table')
      .populate('room')
      .populate('guest')
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tableId, orderType = 'DINE_IN', items, notes } = req.body;

    if (!items || !items.length) {
      res.status(400).json({ error: 'Order must contain at least one item.' });
      return;
    }

    let subtotal = 0;
    const processedItems = [];

    for (const line of items) {
      const menuItem = await MenuItem.findById(line.menuItemId);
      if (!menuItem) continue;

      const quantity = Math.max(1, parseInt(line.quantity) || 1);
      const lineSubtotal = Math.round(menuItem.price * quantity * 100) / 100;
      subtotal += lineSubtotal;

      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity,
        unitPrice: menuItem.price,
        subtotal: lineSubtotal,
        specialInstructions: line.specialInstructions,
        preparationTimeMinutes: menuItem.preparationTimeMinutes || 20
      });
    }

    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.10 * 100) / 100;
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const maxFoodPrepTime = Math.max(...processedItems.map(i => i.preparationTimeMinutes || 20), 15);

    const order = new RestaurantOrder({
      orderNumber,
      table: tableId || undefined,
      orderType,
      items: processedItems,
      subtotal,
      tax,
      serviceCharge,
      total,
      status: 'NEW',
      serverStaff: req.user?._id,
      notes,
      estimatedReadyMinutes: maxFoodPrepTime,
      estimatedReadyAt: new Date(Date.now() + maxFoodPrepTime * 60 * 1000)
    });

    await order.save();

    if (tableId) {
      await RestaurantTable.findByIdAndUpdate(tableId, {
        status: 'OCCUPIED',
        currentOrder: order._id
      });
    }

    await logAuditAction(req, 'CREATE_RESTAURANT_ORDER', 'RestaurantOrder', order._id.toString(), `Created order #${orderNumber} for ETB ${total}`);

    res.status(201).json({ message: 'Order created', order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    const order = await RestaurantOrder.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.status = status;
    if (status === 'PAID') {
      order.paidAt = new Date();
      if (paymentMethod) order.paymentMethod = paymentMethod;

      if (order.table) {
        await RestaurantTable.findByIdAndUpdate(order.table, {
          status: 'AVAILABLE',
          currentOrder: undefined
        });
      }
    }

    await order.save();

    await logAuditAction(req, 'UPDATE_ORDER_STATUS', 'RestaurantOrder', order._id.toString(), `Changed status of order #${order.orderNumber} to ${status}`);

    res.json({ message: 'Order status updated', order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * CRITICAL FEATURE: Charge restaurant order directly to a guest room folio
 */
export const chargeOrderToRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Order ID
    const { roomNumber } = req.body;

    if (!roomNumber) {
      res.status(400).json({ error: 'Room number is required to charge to room.' });
      return;
    }

    const order = await RestaurantOrder.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.chargedToRoom) {
      res.status(400).json({ error: 'This order has already been charged to a room.' });
      return;
    }

    // Find the room and the checked-in stay
    const room = await Room.findOne({ roomNumber: roomNumber.trim(), isActive: true });
    if (!room) {
      res.status(404).json({ error: `Room ${roomNumber} not found.` });
      return;
    }

    const stay = await Stay.findOne({ room: room._id, status: 'IN_HOUSE' })
      .populate('guest')
      .populate('folio');

    if (!stay || !stay.folio) {
      res.status(400).json({ 
        error: `Room ${roomNumber} does not have an active checked-in guest stay.` 
      });
      return;
    }

    // Post charge directly into Guest Folio
    const category = order.orderType === 'ROOM_SERVICE' ? 'ROOM_SERVICE' : 'RESTAURANT';
    const description = `Restaurant Charge (${order.orderNumber}): ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`;

    const updatedFolio = await FolioService.addCharge((stay.folio as any)._id, {
      category,
      description,
      quantity: 1,
      unitPrice: order.subtotal, // Subtotal; addCharge will apply standard taxes & service charge
      referenceId: order.orderNumber,
      postedBy: req.user?._id
    });

    // Update the restaurant order
    order.chargedToRoom = true;
    order.room = room._id;
    order.stay = stay._id;
    order.guest = stay.guest._id;
    order.folio = (stay.folio as any)._id;
    order.status = 'PAID';
    order.paymentMethod = 'ROOM_CHARGE';
    order.paidAt = new Date();
    await order.save();

    // Release table if occupied
    if (order.table) {
      await RestaurantTable.findByIdAndUpdate(order.table, {
        status: 'AVAILABLE',
        currentOrder: undefined
      });
    }

    await logAuditAction(
      req, 
      'CHARGE_ORDER_TO_ROOM', 
      'RestaurantOrder', 
      order._id.toString(), 
      `Charged restaurant order #${order.orderNumber} (ETB ${order.total}) to Room ${room.roomNumber} (Guest: ${(stay.guest as any)?.fullName})`
    );

    res.json({
      message: `Successfully charged order #${order.orderNumber} (ETB ${order.total}) to Room ${room.roomNumber}!`,
      order,
      folio: updatedFolio,
      guestName: (stay.guest as any)?.fullName
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Set food preparation & delivery timer for an order, with support for per-item food timers
 * Ticking timer is visible to both kitchen staff and in-room guest!
 */
export const setOrderTimer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { minutes, status, itemTimers } = req.body;

    const order = await RestaurantOrder.findById(id).populate('room').populate('items.menuItem');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // If per-food item timers are specified, update each food item
    if (itemTimers && Array.isArray(itemTimers)) {
      for (const it of itemTimers) {
        if (typeof it.index === 'number' && order.items[it.index]) {
          order.items[it.index].preparationTimeMinutes = Number(it.minutes) || 15;
        } else if (it.itemId) {
          const item = order.items.find(i => (i as any)._id?.toString() === it.itemId || i.menuItem?.toString() === it.itemId);
          if (item) {
            item.preparationTimeMinutes = Number(it.minutes) || 15;
          }
        }
      }
    }

    // Determine total preparation time: explicit minutes or longest food item
    let prepMinutes = Number(minutes);
    if (!prepMinutes || isNaN(prepMinutes)) {
      prepMinutes = Math.max(...order.items.map(i => i.preparationTimeMinutes || 20), 15);
    }

    order.estimatedReadyMinutes = prepMinutes;
    order.estimatedReadyAt = new Date(Date.now() + prepMinutes * 60 * 1000);

    if (status) {
      order.status = status;
    } else if (order.status === 'NEW') {
      order.status = 'PREPARING';
    }

    await order.save();

    await logAuditAction(
      req,
      'SET_ORDER_TIMER',
      'RestaurantOrder',
      order._id.toString(),
      `Set prep timer of ${prepMinutes} mins for Order #${order.orderNumber}`
    );

    res.json({
      status: 'success',
      message: `Timer set: Ready in ${prepMinutes} minutes (${order.estimatedReadyAt.toLocaleTimeString()})`,
      order
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Batch update all active orders for a room (e.g. from same room)
 */
export const batchUpdateRoomOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.params;
    const { status, minutes } = req.body;

    const room = await Room.findOne({ roomNumber: roomNumber.trim() });
    if (!room) {
      res.status(404).json({ error: `Room ${roomNumber} not found` });
      return;
    }

    const activeFilter: any = {
      room: room._id,
      status: { $in: ['NEW', 'PREPARING', 'READY'] }
    };

    const orders = await RestaurantOrder.find(activeFilter);
    if (orders.length === 0) {
      res.status(404).json({ error: `No active food orders found for Room ${roomNumber}` });
      return;
    }

    const updatedOrders = [];
    for (const order of orders) {
      if (status) {
        order.status = status;
      }
      if (minutes) {
        const prepMin = Number(minutes);
        order.estimatedReadyMinutes = prepMin;
        order.estimatedReadyAt = new Date(Date.now() + prepMin * 60 * 1000);
      }
      await order.save();
      updatedOrders.push(order);
    }

    await logAuditAction(
      req,
      'BATCH_UPDATE_ROOM_ORDERS',
      'RestaurantOrder',
      room._id.toString(),
      `Updated ${updatedOrders.length} orders for Room ${roomNumber} (status: ${status || 'unchanged'}, timer: ${minutes ? `${minutes}m` : 'unchanged'})`
    );

    res.json({
      status: 'success',
      message: `Updated ${updatedOrders.length} orders for Room ${roomNumber}`,
      orders: updatedOrders
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
