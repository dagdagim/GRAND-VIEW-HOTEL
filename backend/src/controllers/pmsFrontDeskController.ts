import { Response } from 'express';
import { 
  Room, 
  Reservation, 
  Stay, 
  Folio, 
  HousekeepingTask, 
  Guest,
  HotelSettings,
  GuestServiceRequest,
  User,
  Notification
} from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { FolioService } from '../services/folioService.js';
import { EmailService } from '../services/emailService.js';

export const getFrontDeskBoard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('roomType')
      .populate({
        path: 'currentStay',
        populate: [{ path: 'guest' }, { path: 'reservation' }, { path: 'folio' }]
      })
      .populate({
        path: 'currentReservation',
        populate: [{ path: 'guest' }]
      })
      .sort({ floor: 1, roomNumber: 1 });

    // Today's boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find active/upcoming confirmed or pending reservations that reserve physical rooms
    const activeReservations = await Reservation.find({
      status: { $in: ['CONFIRMED', 'PENDING'] },
      assignedRoom: { $ne: null },
      checkOutDate: { $gte: startOfToday }
    }).populate('guest').populate('roomType');

    const reservationByRoomId = new Map<string, any>();
    for (const resv of activeReservations) {
      if (resv.assignedRoom) {
        const rId = resv.assignedRoom._id ? resv.assignedRoom._id.toString() : resv.assignedRoom.toString();
        const existing = reservationByRoomId.get(rId);
        if (!existing || new Date(resv.checkInDate) < new Date(existing.checkInDate)) {
          reservationByRoomId.set(rId, resv);
        }
      }
    }

    // Group rooms by floor
    const floorsMap: Record<number, any[]> = {};
    const statusCounts = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      CLEANING: 0,
      DIRTY: 0,
      MAINTENANCE: 0,
      OUT_OF_SERVICE: 0,
      TOTAL: rooms.length
    };

    for (const room of rooms) {
      const assignedResv = reservationByRoomId.get(room._id.toString());

      // If room has an active/upcoming confirmed booking and is not currently occupied or maintenance
      if (assignedResv && room.status !== 'OCCUPIED' && room.status !== 'MAINTENANCE' && room.status !== 'OUT_OF_SERVICE') {
        room.status = 'RESERVED';
        room.currentReservation = assignedResv;
        // Asynchronously sync to database
        Room.findByIdAndUpdate(room._id, { status: 'RESERVED', currentReservation: assignedResv._id }).exec();
      } else if (room.status === 'RESERVED' && !assignedResv) {
        room.status = 'AVAILABLE';
        room.currentReservation = undefined;
        Room.findByIdAndUpdate(room._id, { status: 'AVAILABLE', $unset: { currentReservation: 1 } }).exec();
      }

      if (!floorsMap[room.floor]) {
        floorsMap[room.floor] = [];
      }
      floorsMap[room.floor].push(room);

      if (statusCounts[room.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[room.status as keyof typeof statusCounts]++;
      }
    }

    // Today & Overdue Arrivals (Pending check-in)
    let todayArrivals = await Reservation.find({
      checkInDate: { $lte: endOfToday },
      checkOutDate: { $gte: startOfToday },
      status: { $in: ['CONFIRMED', 'PENDING'] }
    })
      .populate('guest')
      .populate('roomType')
      .populate('assignedRoom')
      .sort({ checkInDate: 1 });

    // If fewer than 6, also include upcoming arrivals for the next 7 days so front desk always has active arrival pipeline
    if (todayArrivals.length < 6) {
      const existingIds = todayArrivals.map(a => a._id);
      const upcoming = await Reservation.find({
        _id: { $nin: existingIds },
        checkInDate: { $gt: endOfToday },
        status: { $in: ['CONFIRMED', 'PENDING'] }
      })
        .populate('guest')
        .populate('roomType')
        .populate('assignedRoom')
        .sort({ checkInDate: 1 })
        .limit(8 - todayArrivals.length);
      todayArrivals = [...todayArrivals, ...upcoming];
    }

    const todayDepartures = await Reservation.find({
      checkOutDate: { $gte: startOfToday, $lte: endOfToday },
      status: 'CHECKED_IN'
    }).populate('guest').populate('roomType').populate('assignedRoom');

    // In-Room Guest Service Requests for Front Desk
    const guestRequests = await GuestServiceRequest.find()
      .populate('room')
      .populate('assignedStaff', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      floors: floorsMap,
      statusCounts,
      todayArrivals,
      todayDepartures,
      guestRequests
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkInGuest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reservationId, roomId, keyCardsIssued = 1 } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('guest').populate('roomType');
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    if (reservation.status === 'CHECKED_IN') {
      res.status(400).json({ error: 'Guest is already checked in.' });
      return;
    }

    const targetRoomId = roomId || reservation.assignedRoom;
    if (!targetRoomId) {
      res.status(400).json({ error: 'No room assigned. Please select an available room.' });
      return;
    }

    const room = await Room.findById(targetRoomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Business rule: Dirty / Maintenance / Out-of-service rooms cannot be checked in
    if (room.status === 'MAINTENANCE' || room.status === 'OUT_OF_SERVICE') {
      res.status(400).json({ error: `Room ${room.roomNumber} is currently under ${room.status} and cannot be checked in.` });
      return;
    }

    if (room.cleanStatus === 'DIRTY') {
      res.status(400).json({ error: `Room ${room.roomNumber} is marked DIRTY and must be cleaned and inspected before check-in.` });
      return;
    }

    if (room.status === 'OCCUPIED') {
      res.status(409).json({ error: `Room ${room.roomNumber} is already OCCUPIED by another guest.` });
      return;
    }

    // Find or create Folio
    let folio = await Folio.findOne({ reservation: reservation._id });
    if (!folio) {
      folio = new Folio({
        folioNumber: `FOL-${reservation.bookingNumber.replace('GVH-', '')}`,
        reservation: reservation._id,
        guest: reservation.guest._id,
        room: room._id,
        subtotal: reservation.pricing.subtotal,
        taxTotal: reservation.pricing.tax,
        serviceChargeTotal: reservation.pricing.serviceCharge,
        grandTotal: reservation.pricing.total,
        paidTotal: reservation.pricing.paidAmount,
        balance: reservation.pricing.balance,
        status: reservation.pricing.balance <= 0 ? 'SETTLED' : 'OPEN'
      });
      await folio.save();
    }

    // Generate 6-digit one-time passcode for In-Room Guest Portal
    const guestAccessCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create Stay record
    const stay = new Stay({
      reservation: reservation._id,
      guest: reservation.guest._id,
      room: room._id,
      roomType: reservation.roomType._id,
      checkInTime: new Date(),
      scheduledCheckOut: reservation.checkOutDate,
      guestAccessCode,
      guestAccessCodeExpiresAt: reservation.checkOutDate,
      keyCardsIssued,
      folio: folio._id,
      status: 'IN_HOUSE',
      roomHistory: [
        {
          room: room._id,
          from: new Date(),
          reason: 'Initial Check-in',
          changedBy: req.user?._id
        }
      ]
    });
    await stay.save();

    // Update Room status to OCCUPIED
    room.status = 'OCCUPIED';
    room.currentStay = stay._id;
    room.currentReservation = reservation._id;
    await room.save();

    // Update Reservation status to CHECKED_IN
    reservation.status = 'CHECKED_IN';
    reservation.assignedRoom = room._id;
    reservation.stayRef = stay._id;
    await reservation.save();

    // Update Folio with stay ref
    folio.stay = stay._id;
    folio.room = room._id;
    await folio.save();

    await logAuditAction(
      req, 
      'CHECK_IN_GUEST', 
      'Stay', 
      stay._id.toString(), 
      `Checked in guest ${(reservation.guest as any)?.fullName} to Room ${room.roomNumber} (Booking #${reservation.bookingNumber})`
    );

    // Send in-room access passcode to guest email if available
    let emailSentTo: string | null = null;
    let guestEmail = (reservation.guest as any)?.email;
    let guestName = (reservation.guest as any)?.fullName || `${(reservation.guest as any)?.firstName || ''} ${(reservation.guest as any)?.lastName || ''}`.trim();

    if (!guestEmail && reservation.guest) {
      const gDoc: any = await Guest.findById((reservation.guest as any)._id || reservation.guest);
      if (gDoc) {
        guestEmail = gDoc.email;
        if (!guestName) {
          guestName = gDoc.fullName || `${gDoc.firstName || ''} ${gDoc.lastName || ''}`.trim();
        }
      }
    }

    if (!guestEmail && stay.guest) {
      const gDoc: any = await Guest.findById((stay.guest as any)._id || stay.guest);
      if (gDoc) {
        guestEmail = gDoc.email;
        if (!guestName) {
          guestName = gDoc.fullName || `${gDoc.firstName || ''} ${gDoc.lastName || ''}`.trim();
        }
      }
    }

    if (guestEmail) {
      emailSentTo = guestEmail;
      const settings = await HotelSettings.findOne();
      
      try {
        const emailResult = await EmailService.sendInRoomPasscodeEmail({
          toEmail: guestEmail,
          guestName: guestName || 'Valued Guest',
          roomNumber: room.roomNumber,
          roomType: (reservation.roomType as any)?.name || 'Suite',
          passcode: guestAccessCode,
          checkOutDate: reservation.checkOutDate,
          wifiSsid: (settings as any)?.wifiSsid || 'GrandView_Guest_5G',
          wifiPassword: (settings as any)?.wifiPassword || 'WelcomeGrandView2026',
          hotelPhone: (settings as any)?.phone || '+251 11 661 8000',
          clientUrl: 'https://grand-view-hotel.onrender.com'
        });
        if (emailResult.success) {
          console.log(`[CHECK-IN PASSCODE EMAIL] Successfully delivered to ${guestEmail} for Room ${room.roomNumber}`);
        } else {
          console.warn(`[CHECK-IN PASSCODE EMAIL] ${emailResult.message}`);
        }
      } catch (err) {
        console.error('[CHECK-IN PASSCODE EMAIL ERROR] Failed to dispatch email:', err);
      }
    }

    res.json({
      message: `Check-in successful! Guest checked into Room ${room.roomNumber}. ${emailSentTo ? `Access passcode sent to ${emailSentTo}.` : ''}`,
      stay,
      reservation,
      room,
      guestAccessCode,
      emailSentTo,
      portalUrl: `https://grand-view-hotel.onrender.com/room/${room.roomNumber}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkOutGuest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { stayId, paymentMethod, paidAmount } = req.body;

    const stay = await Stay.findById(stayId).populate('guest').populate('room').populate('reservation');
    if (!stay) {
      res.status(404).json({ error: 'Stay not found.' });
      return;
    }

    if (stay.status === 'CHECKED_OUT') {
      res.status(400).json({ error: 'Stay has already been checked out.' });
      return;
    }

    // Recalculate Folio balance
    let folio: any = await Folio.findById(stay.folio);
    if (folio) {
      folio = await FolioService.recalculateFolio(folio._id);
    }

    // If there is an outstanding balance and payment is provided now
    if (folio && folio.balance > 0 && paidAmount && Number(paidAmount) > 0) {
      const pmtAmount = Number(paidAmount);
      const paymentRecord = new (await import('../models/index.js')).Payment({
        transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        folio: folio._id,
        reservation: stay.reservation._id,
        guest: stay.guest._id,
        amount: pmtAmount,
        currency: 'ETB',
        paymentMethod: paymentMethod || 'CASH',
        status: 'PAID',
        notes: 'Check-out settlement',
        paidAt: new Date(),
        processedBy: req.user?._id
      });
      await paymentRecord.save();

      folio.payments.push(paymentRecord._id);
      await folio.save();
      folio = await FolioService.recalculateFolio(folio._id);
    }

    if (folio && folio.balance <= 0) {
      folio.status = 'SETTLED';
      await folio.save();
    }

    // Mark any room service restaurant orders for this stay as PAID
    const { RestaurantOrder } = await import('../models/index.js');
    await RestaurantOrder.updateMany(
      { stay: stay._id, status: { $ne: 'CANCELLED' } },
      { status: 'PAID', paidAt: new Date() }
    );

    // Update Stay status
    stay.status = 'CHECKED_OUT';
    stay.actualCheckOutTime = new Date();
    stay.guestAccessCodeExpiresAt = new Date(); // Expire In-Room Portal Passcode immediately
    stay.guestAccessCode = undefined; // Wipe one-time passcode immediately
    await stay.save();

    // Update Reservation status
    const reservation = await Reservation.findById(stay.reservation);
    if (reservation) {
      reservation.status = 'CHECKED_OUT';
      await reservation.save();
    }

    // Enforce Business Rule: Check-out changes Room to DIRTY
    const room = await Room.findById(stay.room);
    if (room) {
      room.status = 'DIRTY';
      room.cleanStatus = 'DIRTY';
      room.currentStay = undefined;
      room.currentReservation = undefined;
      await room.save();

      // Automatically dispatch high-priority Housekeeping Task
      const taskNumber = `HK-${Date.now().toString().slice(-5)}`;
      await HousekeepingTask.create({
        taskNumber,
        room: room._id,
        taskType: 'DEPARTURE_CLEAN',
        priority: 'HIGH',
        stage: 'DIRTY',
        notes: `Departure clean after check-out of ${(stay.guest as any)?.fullName}`
      });
    }

    await logAuditAction(
      req, 
      'CHECK_OUT_GUEST', 
      'Stay', 
      stay._id.toString(), 
      `Checked out ${(stay.guest as any)?.fullName} from Room ${(room as any)?.roomNumber}. Final balance: ETB ${folio?.balance || 0}`
    );

    res.json({
      message: `Guest successfully checked out from Room ${(room as any)?.roomNumber}. Room marked DIRTY and queued for Housekeeping.`,
      stay,
      folio,
      balanceRemaining: folio?.balance || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const transferRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { stayId, newRoomId, reason } = req.body;

    const stay = await Stay.findById(stayId).populate('room');
    if (!stay || stay.status !== 'IN_HOUSE') {
      res.status(404).json({ error: 'Active in-house stay not found.' });
      return;
    }

    const currentRoom = await Room.findById(stay.room);
    const targetRoom = await Room.findById(newRoomId);

    if (!targetRoom || !targetRoom.isActive || targetRoom.status === 'OUT_OF_SERVICE') {
      res.status(400).json({ error: 'Target room is not available.' });
      return;
    }

    if (targetRoom.status === 'OCCUPIED') {
      res.status(409).json({ error: `Target Room ${targetRoom.roomNumber} is already OCCUPIED.` });
      return;
    }

    if (targetRoom.cleanStatus === 'DIRTY') {
      res.status(400).json({ error: `Target Room ${targetRoom.roomNumber} is marked DIRTY.` });
      return;
    }

    // Log history
    stay.roomHistory.push({
      room: targetRoom._id,
      from: new Date(),
      reason: reason || 'Guest requested room transfer',
      changedBy: req.user?._id
    });
    stay.room = targetRoom._id;
    await stay.save();

    // Release old room -> becomes DIRTY
    if (currentRoom) {
      currentRoom.status = 'DIRTY';
      currentRoom.cleanStatus = 'DIRTY';
      currentRoom.currentStay = undefined;
      currentRoom.currentReservation = undefined;
      await currentRoom.save();

      // Housekeeping task for old room
      await HousekeepingTask.create({
        taskNumber: `HK-${Date.now().toString().slice(-5)}`,
        room: currentRoom._id,
        taskType: 'TOUCH_UP',
        priority: 'MEDIUM',
        stage: 'DIRTY',
        notes: `Transfer clean after guest moved to Room ${targetRoom.roomNumber}`
      });
    }

    // New room becomes OCCUPIED
    targetRoom.status = 'OCCUPIED';
    targetRoom.currentStay = stay._id;
    await targetRoom.save();

    // Update reservation assigned room
    await Reservation.findByIdAndUpdate(stay.reservation, { assignedRoom: targetRoom._id });

    // Update Folio room ref
    await Folio.findByIdAndUpdate(stay.folio, { room: targetRoom._id });

    await logAuditAction(
      req, 
      'ROOM_TRANSFER', 
      'Stay', 
      stay._id.toString(), 
      `Transferred guest from Room ${currentRoom?.roomNumber} to Room ${targetRoom.roomNumber}. Reason: ${reason}`
    );

    res.json({
      message: `Successfully transferred guest to Room ${targetRoom.roomNumber}.`,
      stay,
      oldRoom: currentRoom?.roomNumber,
      newRoom: targetRoom.roomNumber
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoomPortalDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.params;
    const room = await Room.findOne({ roomNumber }).populate('roomType');
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    let activeStay: any = null;
    if (room.currentStay) {
      activeStay = await Stay.findById(room.currentStay)
        .populate('guest')
        .populate('reservation');
    }

    const settings = await HotelSettings.findOne() || {
      wifiSsid: 'GrandView_Guest_5G',
      wifiPassword: 'WelcomeGrandView2026',
      phone: '+251 11 661 8000'
    };

    res.json({
      status: 'success',
      data: {
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        status: room.status,
        cleanStatus: room.cleanStatus,
        isOccupied: room.status === 'OCCUPIED' && !!activeStay,
        activeStay: activeStay ? {
          stayId: activeStay._id,
          guestName: (activeStay.guest as any)?.fullName || (activeStay.guest as any)?.name,
          guestEmail: (activeStay.guest as any)?.email,
          checkInTime: activeStay.checkInTime,
          scheduledCheckOut: activeStay.scheduledCheckOut,
          guestAccessCode: activeStay.guestAccessCode,
          guestAccessCodeExpiresAt: activeStay.guestAccessCodeExpiresAt,
          doNotDisturb: activeStay.doNotDisturb
        } : null,
        portalUrl: `/room/${room.roomNumber}`,
        wifiSsid: (settings as any).wifiSsid || 'GrandView_Guest_5G',
        wifiPassword: (settings as any).wifiPassword || 'WelcomeGrandView2026',
        hotelPhone: (settings as any).phone || '+251 11 661 8000'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const regenerateRoomPasscode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.params;
    const room = await Room.findOne({ roomNumber });
    if (!room || !room.currentStay) {
      res.status(400).json({ error: 'Room is not currently occupied with an active stay.' });
      return;
    }

    const stay = await Stay.findById(room.currentStay);
    if (!stay || stay.status !== 'IN_HOUSE') {
      res.status(400).json({ error: 'No active in-house stay found for this room.' });
      return;
    }

    const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();
    stay.guestAccessCode = newPasscode;
    stay.guestAccessCodeExpiresAt = stay.scheduledCheckOut;
    await stay.save();

    await logAuditAction(
      req,
      'REGENERATE_ROOM_PASSCODE',
      'Stay',
      stay._id.toString(),
      `Regenerated In-Room Guest Portal passcode for Room ${room.roomNumber}`
    );

    const clientUrl = (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'))
      ? process.env.CLIENT_URL
      : 'https://grand-view-hotel.onrender.com';

    res.json({
      stayId: stay._id,
      roomNumber: (stay.room as any)?.roomNumber,
      guestName: (stay.guest as any)?.fullName,
      email: (stay.guest as any)?.email,
      passcode: stay.guestAccessCode,
      expiresAt: stay.guestAccessCodeExpiresAt,
      portalUrl: `${clientUrl}/room-portal/${(stay.room as any)?.roomNumber}`,
      isExpired: stay.guestAccessCodeExpiresAt && new Date(stay.guestAccessCodeExpiresAt) <= new Date()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== GUEST SERVICE REQUEST DISPATCH ====================

export const listGuestRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;

    const requests = await GuestServiceRequest.find(filter)
      .populate('room')
      .populate('stay')
      .populate('assignedStaff', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const dispatchGuestRequestToHousekeeping = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedStaffId, staffNotes } = req.body;

    const request = await GuestServiceRequest.findById(id).populate('room');
    if (!request) {
      res.status(404).json({ error: 'Guest service request not found' });
      return;
    }

    request.status = 'IN_PROGRESS';
    if (assignedStaffId) {
      const staffUser = await User.findById(assignedStaffId);
      request.assignedStaff = assignedStaffId;
      request.assignedStaffName = staffUser?.name || 'Staff Member';
    }
    await request.save();

    // Check if HousekeepingTask exists or create one
    let task = request.housekeepingTask ? await HousekeepingTask.findById(request.housekeepingTask) : null;
    if (!task && request.room) {
      const taskNumber = `HK-DISPATCH-${Date.now().toString().slice(-4)}`;
      task = await HousekeepingTask.create({
        taskNumber,
        room: (request.room as any)?._id || request.room,
        taskType: request.item.includes('Clean') ? 'STAYOVER_CLEAN' : 'TOUCH_UP',
        priority: request.priority === 'URGENT' ? 'URGENT' : 'HIGH',
        stage: assignedStaffId ? 'ASSIGNED' : 'DIRTY',
        assignedStaff: assignedStaffId || undefined,
        guestServiceRequest: request._id,
        notes: `Front Desk dispatched to Housekeeping: ${request.item}. Notes: ${staffNotes || request.specialInstructions || 'None'}`
      });
      request.housekeepingTask = task._id;
      await request.save();
    } else if (task) {
      task.stage = assignedStaffId ? 'ASSIGNED' : 'CLEANING';
      if (assignedStaffId) task.assignedStaff = assignedStaffId;
      if (staffNotes) task.notes = (task.notes ? task.notes + ' | ' : '') + staffNotes;
      await task.save();
    }

    // Mark room cleanStatus as DIRTY if cleaning is requested
    if (request.item.includes('Clean') && request.room) {
      await Room.findByIdAndUpdate((request.room as any)?._id || request.room, { cleanStatus: 'DIRTY' });
    }

    await logAuditAction(
      req,
      'DISPATCH_GUEST_REQUEST',
      'GuestServiceRequest',
      request._id.toString(),
      `Reception dispatched request "${request.item}" for Room ${request.roomNumber} to Housekeeping (Assigned: ${request.assignedStaffName || 'Team Queue'})`
    );

    res.json({
      message: `Request for Room ${request.roomNumber} dispatched to Housekeeping successfully!`,
      request,
      task
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGuestRequestStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await GuestServiceRequest.findById(id).populate('room');
    if (!request) {
      res.status(404).json({ error: 'Guest service request not found' });
      return;
    }

    request.status = status;
    if (status === 'COMPLETED') {
      request.completedAt = new Date();
      request.completedBy = req.user?._id;

      if (request.housekeepingTask) {
        await HousekeepingTask.findByIdAndUpdate(request.housekeepingTask, {
          stage: 'READY',
          completedAt: new Date()
        });
      }
      if (request.room && request.category === 'HOUSEKEEPING') {
        await Room.findByIdAndUpdate((request.room as any)?._id || request.room, { cleanStatus: 'CLEAN' });
      }
    }
    await request.save();

    res.json({ message: `Request status updated to ${status}`, request });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const sendRoomPasscodeEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.params;
    const { customEmail, clientUrl: reqClientUrl } = req.body;

    const room = await Room.findOne({ roomNumber }).populate('roomType');
    if (!room || !room.currentStay) {
      res.status(400).json({ error: 'Room is not currently occupied with an active stay.' });
      return;
    }

    const stay = await Stay.findById(room.currentStay).populate('guest').populate('roomType');
    if (!stay || stay.status !== 'IN_HOUSE') {
      res.status(400).json({ error: 'No active in-house stay found for this room.' });
      return;
    }

    // Ensure passcode exists
    if (!stay.guestAccessCode) {
      stay.guestAccessCode = Math.floor(100000 + Math.random() * 900000).toString();
      stay.guestAccessCodeExpiresAt = stay.scheduledCheckOut;
      await stay.save();
    }

    let recipientEmail = customEmail || (stay.guest as any)?.email;
    let guestName = (stay.guest as any)?.fullName || (stay.guest as any)?.name;

    if (!recipientEmail && stay.guest) {
      const gDoc: any = await Guest.findById((stay.guest as any)._id || stay.guest);
      if (gDoc) {
        recipientEmail = gDoc.email;
        if (!guestName) {
          guestName = gDoc.fullName || `${gDoc.firstName || ''} ${gDoc.lastName || ''}`.trim();
        }
      }
    }

    if (!recipientEmail) {
      res.status(400).json({ error: 'No email address associated with this guest. Please provide an email address.' });
      return;
    }

    // Determine client URL - always ensure guest portal links route to live production website, never localhost
    const callerOrigin = reqClientUrl || req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    let effectiveClientUrl = callerOrigin || process.env.CLIENT_URL || 'https://grand-view-hotel.onrender.com';
    if (!effectiveClientUrl || effectiveClientUrl.includes('localhost') || effectiveClientUrl.includes('127.0.0.1')) {
      effectiveClientUrl = 'https://grand-view-hotel.onrender.com';
    }

    const settings = await HotelSettings.findOne();
    const emailResult = await EmailService.sendInRoomPasscodeEmail({
      toEmail: recipientEmail,
      guestName: guestName || 'Valued Guest',
      roomNumber: room.roomNumber,
      roomType: (stay.roomType as any)?.name || 'Suite',
      passcode: stay.guestAccessCode,
      checkOutDate: stay.scheduledCheckOut,
      wifiSsid: (settings as any)?.wifiSsid || 'GrandView_Guest_5G',
      wifiPassword: (settings as any)?.wifiPassword || 'WelcomeGrandView2026',
      hotelPhone: (settings as any)?.phone || '+251 11 661 8000',
      clientUrl: effectiveClientUrl
    });

    res.json({
      status: emailResult.success ? 'success' : 'warning',
      emailDelivered: emailResult.success,
      message: emailResult.success
        ? `Passcode [${stay.guestAccessCode}] successfully emailed to ${recipientEmail}!`
        : `In-room passcode is [${stay.guestAccessCode}]. (Cloud email notice: Render free tier blocks outbound SMTP ports 25/465/587. Configure RESEND_API_KEY in Render to enable cloud emails).`,
      email: recipientEmail,
      passcode: stay.guestAccessCode,
      previewUrl: emailResult.previewUrl,
      isSandbox: emailResult.isSandbox
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCheckOutSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;
    const stay = await Stay.findById(stayId)
      .populate('guest')
      .populate('room')
      .populate('roomType')
      .populate('reservation');

    if (!stay) {
      res.status(404).json({ error: 'Stay not found' });
      return;
    }

    let folio: any = await Folio.findById(stay.folio).populate('payments');
    if (folio) {
      folio = await FolioService.recalculateFolio(folio._id);
      folio = await Folio.findById(folio._id).populate('payments');
    }

    // Retrieve any restaurant orders associated with this stay or room
    const { RestaurantOrder } = await import('../models/index.js');
    const restaurantOrders = await RestaurantOrder.find({
      $or: [
        { stay: stay._id },
        { room: stay.room?._id, createdAt: { $gte: stay.checkInTime } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: {
        stay,
        guest: stay.guest,
        room: stay.room,
        reservation: stay.reservation,
        folio,
        restaurantOrders,
        balanceDue: folio?.balance || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

