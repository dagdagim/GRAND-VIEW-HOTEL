import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  Room, 
  Stay, 
  Folio, 
  Guest, 
  MenuItem, 
  RestaurantOrder, 
  HotelSettings, 
  HousekeepingTask, 
  MaintenanceTicket,
  GuestServiceRequest,
  AuditLog,
  Notification
} from '../models/index.js';
import { FolioService } from '../services/folioService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hotel_pms_key_2026_jwt_token_secure';

export interface AuthenticatedGuestRequest extends Request {
  guestSession?: {
    stayId: string;
    roomId: string;
    roomNumber: string;
    guestId: string;
    folioId: string;
  };
  stay?: any;
  room?: any;
}

// Middleware to authenticate In-Room Guest Portal JWT
export const authenticateGuestSession = async (
  req: AuthenticatedGuestRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Guest portal authorization required. Please scan your room QR code or enter your passcode.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || decoded.type !== 'GUEST_ROOM_PORTAL' || !decoded.stayId) {
      res.status(401).json({ error: 'Invalid guest session token.' });
      return;
    }

    const stay = await Stay.findById(decoded.stayId)
      .populate('guest')
      .populate('room')
      .populate('roomType');

    if (!stay) {
      res.status(401).json({ error: 'Stay record not found.' });
      return;
    }

    // Passcode expiration check: check if guest has checked out or passcode expired
    if (stay.status !== 'IN_HOUSE') {
      res.status(401).json({ 
        error: 'Your stay has concluded and room access has expired. Thank you for staying with Grand View Hotel.',
        checkedOut: true
      });
      return;
    }

    if (stay.guestAccessCodeExpiresAt && new Date(stay.guestAccessCodeExpiresAt) <= new Date()) {
      res.status(401).json({ 
        error: 'Your room access passcode has expired. Please contact reception to extend your access.',
        expired: true
      });
      return;
    }

    req.guestSession = decoded;
    req.stay = stay;
    req.room = stay.room;

    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Session expired or invalid. Please re-enter your room passcode.' });
  }
};

// 1. Authenticate with Room Number + One-Time Passcode
export const loginRoomPortal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, passcode } = req.body;

    if (!roomNumber || !passcode) {
      res.status(400).json({ error: 'Room number and one-time passcode are required.' });
      return;
    }

    const cleanRoomNum = String(roomNumber).trim();
    const cleanPasscode = String(passcode).trim();

    const room = await Room.findOne({ roomNumber: cleanRoomNum }).populate('roomType');
    if (!room) {
      res.status(404).json({ error: `Room ${cleanRoomNum} does not exist.` });
      return;
    }

    if (room.status !== 'OCCUPIED' || !room.currentStay) {
      res.status(400).json({ 
        error: `Room ${cleanRoomNum} is not currently occupied. One-time passcodes are generated at front desk check-in.` 
      });
      return;
    }

    const stay = await Stay.findById(room.currentStay)
      .populate('guest')
      .populate('room')
      .populate('roomType');

    if (!stay || stay.status !== 'IN_HOUSE') {
      res.status(401).json({ error: 'No active in-house stay found for this room.' });
      return;
    }

    // Verify passcode match
    if (!stay.guestAccessCode || stay.guestAccessCode !== cleanPasscode) {
      res.status(401).json({ error: 'Invalid room passcode. Please check your keycard sleeve or ask the front desk reception.' });
      return;
    }

    // Verify expiration
    if (stay.guestAccessCodeExpiresAt && new Date(stay.guestAccessCodeExpiresAt) <= new Date()) {
      res.status(401).json({ error: 'This room passcode has expired. Please ask reception for a fresh access code.' });
      return;
    }

    // Generate Guest Portal JWT (expires in 3 days)
    const token = jwt.sign(
      {
        type: 'GUEST_ROOM_PORTAL',
        stayId: stay._id.toString(),
        roomId: room._id.toString(),
        roomNumber: room.roomNumber,
        guestId: stay.guest._id.toString(),
        folioId: stay.folio?.toString()
      },
      JWT_SECRET,
      { expiresIn: '3d' }
    );

    res.json({
      status: 'success',
      message: `Welcome to Room ${room.roomNumber}, ${(stay.guest as any)?.fullName || (stay.guest as any)?.name}!`,
      token,
      guest: {
        name: (stay.guest as any)?.fullName || (stay.guest as any)?.name,
        email: (stay.guest as any)?.email,
        phone: (stay.guest as any)?.phone,
        vipTier: (stay.guest as any)?.vipTier || 'STANDARD'
      },
      stay: {
        stayId: stay._id,
        roomNumber: room.roomNumber,
        roomTypeName: (stay.roomType as any)?.name || 'Luxury Suite',
        checkInTime: stay.checkInTime,
        scheduledCheckOut: stay.scheduledCheckOut,
        doNotDisturb: stay.doNotDisturb || false,
        dayFinished: stay.dayFinished || false,
        dayFinishedAt: stay.dayFinishedAt || null,
        wakeUpCallTime: stay.wakeUpCallTime || '',
        turndownRequested: stay.turndownRequested || false,
        breakfastPreference: stay.breakfastPreference || '',
        dayFinishedNotes: stay.dayFinishedNotes || ''
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get Stay & Room Information
export const getStayInfo = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const stay = req.stay;
    const room = req.room;

    if (!stay || stay.status !== 'IN_HOUSE') {
      res.status(401).json({
        error: 'Your stay has concluded and room access has expired. Thank you for staying with Grand View Hotel.',
        checkedOut: true
      });
      return;
    }

    const settings = await HotelSettings.findOne() || {
      wifiSsid: 'GrandView_Guest_5G',
      wifiPassword: 'WelcomeGrandView2026',
      phone: '+251 11 661 8000',
      address: 'Cameroon Street, Bole Sub-City, Addis Ababa, Ethiopia'
    };

    const roomNum = (room as any)?.roomNumber || req.guestSession?.roomNumber || 'Unknown';
    const guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name || 'Guest';

    res.json({
      status: 'success',
      data: {
        guest: {
          name: guestName,
          email: (stay.guest as any)?.email,
          phone: (stay.guest as any)?.phone,
          vipTier: (stay.guest as any)?.vipTier || 'STANDARD'
        },
        room: {
          roomNumber: roomNum,
          floor: (room as any)?.floor || 1,
          roomType: (stay.roomType as any)?.name || 'Luxury Suite',
          description: (stay.roomType as any)?.description || 'Luxury in-room guest accommodations',
          features: (stay.roomType as any)?.amenities || []
        },
        stay: {
          stayId: stay._id,
          status: stay.status,
          checkInTime: stay.checkInTime,
          scheduledCheckOut: stay.scheduledCheckOut,
          doNotDisturb: stay.doNotDisturb || false,
          dayFinished: stay.dayFinished || false,
          dayFinishedAt: stay.dayFinishedAt || null,
          wakeUpCallTime: stay.wakeUpCallTime || '',
          turndownRequested: stay.turndownRequested || false,
          breakfastPreference: stay.breakfastPreference || '',
          dayFinishedNotes: stay.dayFinishedNotes || ''
        },
        hotelInfo: {
          name: 'Grand View Hotel & Suites',
          wifiSsid: (settings as any).wifiSsid || 'GrandView_Guest_5G',
          wifiPassword: (settings as any).wifiPassword || 'WelcomeGrandView2026',
          frontDeskPhone: (settings as any).phone || '+251 11 661 8000',
          frontDeskExtension: '0',
          roomServiceExtension: '202',
          address: (settings as any).address || 'Cameroon Street, Bole Sub-City, Addis Ababa',
          checkOutStandardTime: '11:00 AM'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Toggle Do Not Disturb (DND)
export const toggleDoNotDisturb = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const stay = req.stay;
    stay.doNotDisturb = !stay.doNotDisturb;
    await stay.save();

    res.json({
      status: 'success',
      doNotDisturb: stay.doNotDisturb,
      message: stay.doNotDisturb 
        ? 'Do Not Disturb activated. Our staff will not knock or service your room until toggled off.' 
        : 'Do Not Disturb deactivated.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. In-Room Dining Menu Catalog
export const getInRoomMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find({ isAvailable: true })
      .populate('category')
      .sort({ name: 1 });

    // Group by category
    const categories: Record<string, any[]> = {};
    for (const item of items) {
      const catName = (item.category as any)?.name || 'Specialties';
      if (!categories[catName]) {
        categories[catName] = [];
      }
      categories[catName].push(item);
    }

    res.json({
      status: 'success',
      totalItems: items.length,
      categories
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Place In-Room Dining Order (Charged to Room Folio)
export const placeRoomServiceOrder = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const { items, notes } = req.body;
    const stay = req.stay;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item.' });
      return;
    }

    // Validate and calculate totals securely against database prices
    let subtotal = 0;
    const populatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        res.status(400).json({ error: `Menu item with ID ${item.menuItemId} not found.` });
        return;
      }
      if (!menuItem.isAvailable) {
        res.status(400).json({ error: `"${menuItem.name}" is currently sold out.` });
        return;
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const itemSubtotal = menuItem.price * quantity;
      subtotal += itemSubtotal;

      populatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity,
        unitPrice: menuItem.price,
        subtotal: itemSubtotal,
        specialInstructions: item.specialInstructions || '',
        preparationTimeMinutes: menuItem.preparationTimeMinutes || 20
      });
    }

    const taxRate = 0.15; // 15% VAT
    const serviceRate = 0.10; // 10% Service Charge
    const tax = Math.round(subtotal * taxRate);
    const serviceCharge = Math.round(subtotal * serviceRate);
    const total = subtotal + tax + serviceCharge;

    const orderNumber = `ORD-RS-${Date.now().toString().slice(-5)}`;

    // Calculate total kitchen preparation time based on food items
    const maxFoodPrepTime = Math.max(...populatedItems.map(i => i.preparationTimeMinutes || 20), 15);

    const roomNum = (stay.room as any)?.roomNumber || req.guestSession?.roomNumber || 'Unknown';
    const roomId = (stay.room as any)?._id || stay.room;
    const guestId = (stay.guest as any)?._id || stay.guest;
    const guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name || 'Guest';

    const newOrder = new RestaurantOrder({
      orderNumber,
      orderType: 'ROOM_SERVICE',
      items: populatedItems,
      subtotal,
      tax,
      serviceCharge,
      total,
      status: 'NEW',
      chargedToRoom: true,
      room: roomId,
      stay: stay._id,
      guest: guestId,
      folio: stay.folio,
      paymentMethod: 'ROOM_CHARGE',
      notes: notes || `Room Service delivery to Room ${roomNum}`,
      estimatedReadyMinutes: maxFoodPrepTime,
      estimatedReadyAt: new Date(Date.now() + maxFoodPrepTime * 60 * 1000)
    });

    await newOrder.save();

    // Post to guest Folio
    if (stay.folio) {
      await FolioService.addCharge(stay.folio, {
        category: 'ROOM_SERVICE',
        description: `Room Service In-Room Dining (${orderNumber})`,
        quantity: 1,
        unitPrice: subtotal,
        taxRate,
        serviceChargeRate: serviceRate,
        referenceId: newOrder._id.toString()
      });
    }

    // Create Audit Log
    await AuditLog.create({
      userName: guestName,
      action: 'ROOM_SERVICE_ORDER',
      resource: 'RestaurantOrder',
      resourceId: newOrder._id.toString(),
      details: `Placed Room Service order #${orderNumber} for Room ${roomNum} (Total: ETB ${total})`
    });

    res.status(201).json({
      status: 'success',
      message: `In-room dining order #${orderNumber} placed successfully! The kitchen is preparing your order.`,
      order: newOrder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Live In-Room Folio & Expense Breakdown
export const getInRoomFolio = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const stay = req.stay;
    if (!stay.folio) {
      res.status(404).json({ error: 'No folio linked to active stay.' });
      return;
    }

    const folio = await Folio.findById(stay.folio).populate('payments');
    if (!folio) {
      res.status(404).json({ error: 'Folio not found.' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        folioNumber: folio.folioNumber,
        currency: 'ETB',
        items: folio.items || [],
        payments: folio.payments || [],
        subtotal: folio.subtotal,
        taxTotal: folio.taxTotal,
        serviceChargeTotal: folio.serviceChargeTotal,
        discountTotal: folio.discountTotal,
        grandTotal: folio.grandTotal,
        paidTotal: folio.paidTotal,
        balance: folio.balance,
        status: folio.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Request In-Room Services (Housekeeping, Maintenance, Concierge)
export const createServiceRequest = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const { category, item, specialInstructions, priority = 'MEDIUM' } = req.body;
    const stay = req.stay;

    if (!category || !item) {
      res.status(400).json({ error: 'Category and item name are required.' });
      return;
    }

    const roomNum = (stay.room as any)?.roomNumber || req.guestSession?.roomNumber || 'Unknown';
    const roomId = (stay.room as any)?._id || stay.room;
    const guestId = (stay.guest as any)?._id || stay.guest;
    const guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name || 'Guest';

    const requestNumber = `REQ-${roomNum}-${Date.now().toString().slice(-4)}`;

    const newRequest = new GuestServiceRequest({
      requestNumber,
      stay: stay._id,
      room: roomId,
      roomNumber: roomNum,
      guest: guestId,
      guestName,
      category,
      item,
      priority,
      status: 'PENDING',
      specialInstructions: specialInstructions || ''
    });

    await newRequest.save();

    // Auto-create Housekeeping Task if category is Housekeeping
    if (category === 'HOUSEKEEPING') {
      const taskNumber = `HK-GUEST-${Date.now().toString().slice(-4)}`;
      const hkTask = await HousekeepingTask.create({
        taskNumber,
        room: roomId,
        taskType: item.includes('Cleaning') || item.includes('Clean') ? 'STAYOVER_CLEAN' : 'TOUCH_UP',
        priority: priority === 'URGENT' ? 'URGENT' : 'HIGH',
        stage: 'DIRTY',
        guestServiceRequest: newRequest._id,
        notes: `Guest request from Room ${roomNum}: ${item}. Notes: ${specialInstructions || 'None'}`
      });
      newRequest.housekeepingTask = hkTask._id;
      await newRequest.save();

      // If it's a room cleaning request, update room cleanStatus
      if (item.includes('Cleaning') || item.includes('Clean')) {
        await Room.findByIdAndUpdate(roomId, { cleanStatus: 'DIRTY' });
      }
    }

    // Auto-create Maintenance Ticket if category is Maintenance
    if (category === 'MAINTENANCE') {
      const ticketNumber = `MNT-GUEST-${Date.now().toString().slice(-4)}`;
      await MaintenanceTicket.create({
        ticketNumber,
        room: roomId,
        category: 'ELECTRICAL',
        priority: priority === 'URGENT' ? 'CRITICAL' : 'HIGH',
        status: 'OPEN',
        issueTitle: `Guest In-Room Defect: ${item}`,
        description: `Reported by Room ${roomNum} guest (${guestName}): ${specialInstructions || item}`,
        reportedByName: guestName
      });
    }

    // Create Notification for Reception & Front Desk
    await Notification.create({
      title: `🛎️ Guest Request: Room ${roomNum} (${guestName})`,
      message: `Guest in Room ${roomNum} requested [${category}] "${item}". ${specialInstructions ? 'Notes: ' + specialInstructions : ''}`,
      type: category === 'MAINTENANCE' ? 'MAINTENANCE_ALERT' : 'ROOM_READY',
      referenceId: newRequest._id.toString(),
      referenceModel: 'GuestServiceRequest',
      targetRoles: ['RECEPTIONIST', 'HOTEL_MANAGER'],
      isRead: false
    });

    // Audit log
    await AuditLog.create({
      userName: guestName,
      action: 'GUEST_SERVICE_REQUEST',
      resource: 'GuestServiceRequest',
      resourceId: newRequest._id.toString(),
      details: `Guest in Room ${roomNum} requested [${category}] ${item}`
    });

    res.status(201).json({
      status: 'success',
      message: `Your request for "${item}" has been received. Our team will assist you promptly.`,
      request: newRequest
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Get Status of Guest Orders and Service Requests
export const getMyOrdersAndRequests = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const stay = req.stay;

    const orders = await RestaurantOrder.find({ stay: stay._id })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    const requests = await GuestServiceRequest.find({ stay: stay._id })
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: {
        orders,
        requests
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Request Express Checkout
export const requestExpressCheckout = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const { preferredTime, notes } = req.body;
    const stay = req.stay;

    const roomNum = (stay.room as any)?.roomNumber || req.guestSession?.roomNumber || 'Unknown';
    const roomId = (stay.room as any)?._id || stay.room || req.guestSession?.roomId;
    const guestId = (stay.guest as any)?._id || stay.guest || req.guestSession?.guestId;
    const guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name || 'Guest';

    const requestNumber = `EXP-CHK-${roomNum}-${Date.now().toString().slice(-4)}`;

    const expRequest = new GuestServiceRequest({
      requestNumber,
      stay: stay._id,
      room: roomId,
      roomNumber: roomNum,
      guest: guestId,
      guestName,
      category: 'EXPRESS_CHECKOUT',
      item: `Express Check-out Request (Target: ${preferredTime || '11:00 AM'})`,
      priority: 'HIGH',
      status: 'PENDING',
      specialInstructions: notes || 'Guest requested express folio review and keycard handover.'
    });

    await expRequest.save();

    await AuditLog.create({
      userName: guestName,
      action: 'EXPRESS_CHECKOUT_REQUEST',
      resource: 'GuestServiceRequest',
      resourceId: expRequest._id.toString(),
      details: `Guest in Room ${roomNum} submitted an express check-out notification.`
    });

    res.json({
      status: 'success',
      message: 'Express check-out notice sent to Front Desk. Your final invoice is being prepared.',
      request: expRequest
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Public Room Status Check (Verifies if room is currently occupied or checked-out)
export const getRoomPublicStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.params;
    const cleanRoomNum = String(roomNumber).trim();
    const room = await Room.findOne({ roomNumber: cleanRoomNum });
    if (!room) {
      res.status(404).json({ error: `Room ${cleanRoomNum} does not exist.` });
      return;
    }

    const isOccupied = room.status === 'OCCUPIED' && !!room.currentStay;
    res.json({
      status: 'success',
      roomNumber: room.roomNumber,
      isOccupied,
      roomStatus: room.status,
      message: isOccupied 
        ? 'Room is currently occupied with an active stay.' 
        : 'Room is currently checked out / unoccupied. Guest portal access is only active during an in-house stay.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 11. Guest Concludes Day ("Day Finished" & Good Night)
export const placeDayFinished = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const { 
      enableDnd = true, 
      wakeUpCallTime = '', 
      turndownRequested = false, 
      turndownItem = 'Extra mineral water & fresh linens',
      breakfastPreference = '', 
      notes = '' 
    } = req.body;
    
    const stay = req.stay;
    const roomNum = (stay.room as any)?.roomNumber || req.guestSession?.roomNumber || 'Unknown';
    const roomId = (stay.room as any)?._id || stay.room || req.guestSession?.roomId;
    const guestId = (stay.guest as any)?._id || stay.guest || req.guestSession?.guestId;
    const guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name || 'Guest';

    // 1. Update Stay record
    stay.dayFinished = true;
    stay.dayFinishedAt = new Date();
    stay.wakeUpCallTime = typeof wakeUpCallTime === 'string' ? wakeUpCallTime.trim() : '';
    stay.turndownRequested = Boolean(turndownRequested);
    stay.breakfastPreference = typeof breakfastPreference === 'string' ? breakfastPreference.trim() : '';
    stay.dayFinishedNotes = typeof notes === 'string' ? notes.trim() : '';
    if (enableDnd) {
      stay.doNotDisturb = true;
    }
    await stay.save();

    // 2. Create GuestServiceRequest for Reception & Staff Tracking
    const requestNumber = `DAY-END-${roomNum}-${Date.now().toString().slice(-4)}`;
    const nightInstructions = [
      enableDnd ? 'Do Not Disturb: Active' : 'Do Not Disturb: Off',
      stay.wakeUpCallTime ? `Wake-Up Call: ${stay.wakeUpCallTime}` : 'Wake-Up Call: None',
      stay.turndownRequested ? `Turndown Requested: Yes (${turndownItem})` : '',
      stay.breakfastPreference ? `Tomorrow Breakfast: ${stay.breakfastPreference}` : '',
      stay.dayFinishedNotes ? `Guest Note: ${stay.dayFinishedNotes}` : ''
    ].filter(Boolean).join(' | ');

    const newRequest = new GuestServiceRequest({
      requestNumber,
      stay: stay._id,
      room: roomId,
      roomNumber: roomNum,
      guest: guestId,
      guestName,
      category: 'DAY_FINISHED',
      item: stay.wakeUpCallTime ? `Day Finished (Wake-Up: ${stay.wakeUpCallTime})` : 'Day Finished - Retired for Night',
      priority: stay.wakeUpCallTime || stay.turndownRequested ? 'HIGH' : 'MEDIUM',
      status: 'PENDING',
      specialInstructions: nightInstructions
    });
    await newRequest.save();

    // 3. Auto-create Housekeeping Task if turndown or fresh amenities requested
    if (stay.turndownRequested) {
      const hkTaskNumber = `HK-NIGHT-${Date.now().toString().slice(-4)}`;
      await HousekeepingTask.create({
        taskNumber: hkTaskNumber,
        room: roomId,
        taskType: 'TURNDOWN',
        priority: 'HIGH',
        stage: 'IN_PROGRESS',
        notes: `Evening Turndown for Room ${roomNum} (${guestName}): ${turndownItem}. Notes: ${stay.dayFinishedNotes || 'None'}`
      });
    }

    // 4. Create Real-Time PMS Notification for Receptionist & Hotel Manager
    const alertParts = [
      stay.wakeUpCallTime ? `⏰ Wake-Up Call: ${stay.wakeUpCallTime}.` : 'No wake-up call requested.',
      enableDnd ? '🔕 DND enabled.' : '',
      stay.turndownRequested ? '🛏️ Turndown/water requested.' : '',
      stay.breakfastPreference ? `🍳 Breakfast: ${stay.breakfastPreference}.` : '',
      stay.dayFinishedNotes ? `📝 "${stay.dayFinishedNotes}"` : ''
    ].filter(Boolean).join(' ');

    await Notification.create({
      title: `🌙 Day Finished: Room ${roomNum} (${guestName})`,
      message: `${guestName} in Room ${roomNum} placed Day Finished at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${alertParts}`,
      type: 'GUEST_DAY_FINISHED',
      referenceId: stay._id.toString(),
      referenceModel: 'Stay',
      targetRoles: ['RECEPTIONIST', 'HOTEL_MANAGER'],
      isRead: false
    });

    // 5. Audit Log
    await AuditLog.create({
      userName: guestName,
      action: 'GUEST_DAY_FINISHED',
      resource: 'Stay',
      resourceId: stay._id.toString(),
      details: `Guest in Room ${roomNum} marked day as finished. Wake-up: ${stay.wakeUpCallTime || 'None'}. DND: ${enableDnd ? 'ON' : 'OFF'}.`
    });

    res.status(200).json({
      status: 'success',
      message: `Day marked as finished! Good night, ${guestName}. Front Desk and Reception have been notified.`,
      dayFinished: true,
      dayFinishedAt: stay.dayFinishedAt,
      wakeUpCallTime: stay.wakeUpCallTime,
      doNotDisturb: stay.doNotDisturb,
      turndownRequested: stay.turndownRequested,
      breakfastPreference: stay.breakfastPreference,
      dayFinishedNotes: stay.dayFinishedNotes,
      request: newRequest
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 12. Reopen / Resume Day (If guest wakes up early or wishes to resume normal day mode)
export const reopenDay = async (req: AuthenticatedGuestRequest, res: Response): Promise<void> => {
  try {
    const stay = req.stay;
    const roomNum = (stay.room as any)?.roomNumber || req.guestSession?.roomNumber || 'Unknown';
    const guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name || 'Guest';

    stay.dayFinished = false;
    await stay.save();

    await AuditLog.create({
      userName: guestName,
      action: 'GUEST_RESUMED_DAY',
      resource: 'Stay',
      resourceId: stay._id.toString(),
      details: `Guest in Room ${roomNum} resumed/reopened their day.`
    });

    res.status(200).json({
      status: 'success',
      message: `Day resumed! In-room daytime services and concierge are active.`,
      dayFinished: false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

