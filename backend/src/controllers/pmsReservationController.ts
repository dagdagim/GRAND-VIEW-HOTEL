import { Response } from 'express';
import { 
  Reservation, 
  Room, 
  RoomType, 
  Guest, 
  Folio, 
  Notification 
} from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { FolioService } from '../services/folioService.js';

export const listReservations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { source, status, search, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (source && source !== 'ALL') {
      filter.source = source;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.checkInDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const query = Reservation.find(filter)
      .populate('guest')
      .populate('roomType')
      .populate('assignedRoom')
      .sort({ createdAt: -1 });

    const totalCount = await Reservation.countDocuments(filter);
    const reservations = await query
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Client-side search filtering if search term provided
    let filtered = reservations;
    if (search) {
      const term = (search as string).toLowerCase();
      filtered = reservations.filter((r: any) => 
        r.bookingNumber.toLowerCase().includes(term) ||
        r.guest?.fullName?.toLowerCase().includes(term) ||
        r.guest?.phone?.includes(term) ||
        r.assignedRoom?.roomNumber?.includes(term)
      );
    }

    res.json({
      total: totalCount,
      page: Number(page),
      reservations: filtered
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getReservationDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id)
      .populate('guest')
      .populate('roomType')
      .populate('assignedRoom')
      .populate('stayRef');

    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    const folio = await Folio.findOne({ reservation: id }).populate('payments');

    res.json({ reservation, folio });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createWalkInReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      roomId,
      roomTypeId,
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      adults = 1,
      children = 0,
      guest: guestInfo,
      paymentMethod = 'CASH',
      paidAmount = 0,
      specialRequests
    } = req.body;

    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({ error: 'Check-out date must be after check-in date.' });
      return;
    }

    // Verify room is available
    const isFree = await AvailabilityService.isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!isFree) {
      res.status(409).json({ error: 'Selected room is not available for these dates.' });
      return;
    }

    const room = await Room.findById(roomId).populate('roomType');
    if (!room) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }

    const roomType = await RoomType.findById(roomTypeId || room.roomType);
    if (!roomType) {
      res.status(404).json({ error: 'Room type not found.' });
      return;
    }

    // Guest registration
    let guest = await Guest.findOne({ 
      $or: [{ email: guestInfo.email?.toLowerCase().trim() }, { phone: guestInfo.phone?.trim() }] 
    });

    if (!guest) {
      guest = new Guest({
        firstName: guestInfo.firstName.trim(),
        lastName: guestInfo.lastName.trim(),
        email: guestInfo.email?.toLowerCase().trim() || `walkin-${Date.now()}@hotel.guest`,
        phone: guestInfo.phone.trim(),
        idType: guestInfo.idType || 'PASSPORT',
        idNumber: guestInfo.idNumber || 'WALK-IN',
        nationality: guestInfo.nationality || 'Ethiopian'
      });
    }
    guest.totalStays += 1;
    await guest.save();

    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const roomRatePerNight = roomType.basePrice;
    const subtotal = roomRatePerNight * nights;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.10 * 100) / 100;
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;
    const initialPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, total - initialPaid);

    const bookingNumber = `GVH-${Math.floor(10000 + Math.random() * 90000)}`;

    const reservation = new Reservation({
      bookingNumber,
      source: 'WALK_IN',
      guest: guest._id,
      roomType: roomType._id,
      assignedRoom: room._id,
      checkInDate,
      checkOutDate,
      nights,
      adults,
      children,
      status: 'CONFIRMED',
      paymentStatus: initialPaid >= total ? 'PAID' : (initialPaid > 0 ? 'PARTIAL' : 'PENDING'),
      paymentMethod,
      pricing: {
        roomRatePerNight,
        subtotal,
        tax,
        serviceCharge,
        discount: 0,
        total,
        paidAmount: initialPaid,
        balance
      },
      specialRequests
    });

    await reservation.save();

    // Immediately update Room status to RESERVED on Front Desk
    await Room.findByIdAndUpdate(room._id, {
      status: 'RESERVED',
      currentReservation: reservation._id
    });

    // Create Folio
    const folioNumber = `FOL-${bookingNumber.replace('GVH-', '')}`;
    const folio = new Folio({
      folioNumber,
      reservation: reservation._id,
      guest: guest._id,
      room: room._id,
      items: [
        {
          date: new Date(),
          category: 'ROOM_CHARGE',
          description: `${roomType.name} (Room ${room.roomNumber}) - ${nights} Night(s)`,
          quantity: nights,
          unitPrice: roomRatePerNight,
          subtotal,
          tax,
          serviceCharge,
          total,
          postedBy: req.user?._id
        }
      ],
      subtotal,
      taxTotal: tax,
      serviceChargeTotal: serviceCharge,
      discountTotal: 0,
      grandTotal: total,
      paidTotal: initialPaid,
      balance,
      status: initialPaid >= total ? 'SETTLED' : 'OPEN'
    });

    await folio.save();

    await logAuditAction(req, 'WALK_IN_RESERVATION', 'Reservation', reservation._id.toString(), `Walk-in booking #${bookingNumber} created for ${guest.fullName} in Room ${room.roomNumber}`);

    res.status(201).json({
      message: 'Walk-in reservation created successfully',
      reservation,
      folio
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    if (reservation.status === 'CHECKED_IN') {
      res.status(400).json({ error: 'Cannot cancel an in-house checked-in stay. Perform check-out instead.' });
      return;
    }

    reservation.status = 'CANCELLED';
    reservation.cancellationReason = reason || 'Guest requested cancellation';
    reservation.cancelledAt = new Date();
    await reservation.save();

    // Free assigned room status if reserved
    if (reservation.assignedRoom) {
      const room = await Room.findById(reservation.assignedRoom);
      if (room && room.status === 'RESERVED') {
        room.status = 'AVAILABLE';
        await room.save();
      }
    }

    await logAuditAction(req, 'CANCEL_RESERVATION', 'Reservation', reservation._id.toString(), `Cancelled booking #${reservation.bookingNumber}: ${reason}`);

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const assignRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { roomId } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    const isFree = await AvailabilityService.isRoomAvailable(
      roomId, 
      reservation.checkInDate, 
      reservation.checkOutDate,
      reservation._id.toString()
    );

    if (!isFree) {
      res.status(409).json({ error: 'This room is not available for the reservation dates.' });
      return;
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    reservation.assignedRoom = room._id;
    await reservation.save();

    // Immediately update Room status to RESERVED on Front Desk
    await Room.findByIdAndUpdate(room._id, {
      status: 'RESERVED',
      currentReservation: reservation._id
    });

    await logAuditAction(req, 'ASSIGN_ROOM', 'Reservation', reservation._id.toString(), `Assigned Room ${room.roomNumber} to booking #${reservation.bookingNumber}`);

    res.json({ message: 'Room assigned successfully', reservation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
