import { Request, Response } from 'express';
import { 
  HotelSettings, 
  RoomType, 
  Room, 
  Guest, 
  Reservation, 
  Folio, 
  Notification,
  Payment 
} from '../models/index.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { PaymentService } from '../services/paymentService.js';
import { EmailService } from '../services/emailService.js';
import { ChapaService } from '../services/chapaService.js';

export const getHotelInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await HotelSettings.findOne();
    if (!settings) {
      settings = await HotelSettings.create({});
    }
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoomTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomTypes = await RoomType.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ roomTypes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoomTypeDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roomType = await RoomType.findById(id);
    if (!roomType) {
      res.status(404).json({ error: 'Room type not found' });
      return;
    }
    res.json({ roomType });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkIn, checkOut, guests = 1 } = req.query;

    if (!checkIn || !checkOut) {
      res.status(400).json({ error: 'checkIn and checkOut dates are required.' });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({ error: 'Invalid dates provided.' });
      return;
    }

    if (checkInDate >= checkOutDate) {
      res.status(400).json({ error: 'Check-out date must be after check-in date.' });
      return;
    }

    const guestCount = parseInt(guests as string, 10) || 1;
    const availability = await AvailabilityService.getAvailabilityForDateRange(
      checkInDate,
      checkOutDate,
      guestCount
    );

    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      checkInDate,
      checkOutDate,
      nights,
      guests: guestCount,
      availability
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      roomTypeId,
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      adults = 1,
      children = 0,
      guest: guestInfo,
      paymentMethod = 'PAY_AT_HOTEL',
      specialRequests,
      arrivalTime = '14:00'
    } = req.body;

    if (!roomTypeId || !checkInStr || !checkOutStr || !guestInfo?.firstName || !guestInfo?.email || !guestInfo?.phone) {
      res.status(400).json({ error: 'Missing required booking information.' });
      return;
    }

    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({ error: 'Check-out date must be after check-in date.' });
      return;
    }

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      res.status(404).json({ error: 'Selected room type does not exist.' });
      return;
    }

    // Verify real-time availability right now to eliminate race conditions
    const availableRoomId = await AvailabilityService.findAvailableRoomForType(
      roomTypeId,
      checkInDate,
      checkOutDate
    );

    if (!availableRoomId) {
      res.status(409).json({ 
        error: 'Sorry, this room type is no longer available for the selected dates. Please choose another room type or modify dates.' 
      });
      return;
    }

    // Find or create Guest profile
    let guest = await Guest.findOne({ email: guestInfo.email.toLowerCase().trim() });
    if (!guest) {
      guest = new Guest({
        firstName: guestInfo.firstName.trim(),
        lastName: guestInfo.lastName.trim(),
        email: guestInfo.email.toLowerCase().trim(),
        phone: guestInfo.phone.trim(),
        nationality: guestInfo.nationality || 'Ethiopian',
        address: guestInfo.address
      });
    } else {
      // Update phone or name if provided
      guest.firstName = guestInfo.firstName.trim();
      guest.lastName = guestInfo.lastName.trim();
      guest.phone = guestInfo.phone.trim();
    }
    guest.totalStays += 1;
    await guest.save();

    // Calculate rates and taxes server-side
    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const roomRatePerNight = roomType.basePrice;
    const subtotal = roomRatePerNight * nights;

    // Default 15% VAT, 10% Service Charge
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.10 * 100) / 100;
    const discount = 0;
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

    // Generate unique booking number
    const bookingNumber = `GVH-${Math.floor(10000 + Math.random() * 90000)}`;

    const isChapa = paymentMethod === 'CHAPA';
    const isPayAtHotel = paymentMethod === 'PAY_AT_HOTEL';
    const isPendingPayment = isChapa || isPayAtHotel;

    const reservation = new Reservation({
      bookingNumber,
      source: 'WEBSITE',
      guest: guest._id,
      roomType: roomType._id,
      assignedRoom: availableRoomId, // Assign available room
      checkInDate,
      checkOutDate,
      nights,
      adults: Math.max(1, adults),
      children: Math.max(0, children),
      status: isChapa ? 'PENDING' : 'CONFIRMED', // Chapa reservations await payment confirmation
      paymentStatus: isPendingPayment ? 'PENDING' : 'PAID',
      paymentMethod,
      pricing: {
        roomRatePerNight,
        subtotal,
        tax,
        serviceCharge,
        discount,
        total,
        paidAmount: isPendingPayment ? 0 : total,
        balance: isPendingPayment ? total : 0
      },
      specialRequests,
      arrivalTime
    });

    await reservation.save();

    // Immediately update Room status to RESERVED on Front Desk
    await Room.findByIdAndUpdate(availableRoomId, {
      status: 'RESERVED',
      currentReservation: reservation._id
    });

    // Create Folio
    const folioNumber = `FOL-${bookingNumber.replace('GVH-', '')}`;
    const folio = new Folio({
      folioNumber,
      reservation: reservation._id,
      guest: guest._id,
      room: availableRoomId,
      items: [
        {
          date: new Date(),
          category: 'ROOM_CHARGE',
          description: `${roomType.name} - ${nights} Night(s) Stay`,
          quantity: nights,
          unitPrice: roomRatePerNight,
          subtotal,
          tax,
          serviceCharge,
          total
        }
      ],
      subtotal,
      taxTotal: tax,
      serviceChargeTotal: serviceCharge,
      discountTotal: 0,
      grandTotal: total,
      paidTotal: isPendingPayment ? 0 : total,
      balance: isPendingPayment ? total : 0,
      status: isPendingPayment ? 'OPEN' : 'SETTLED'
    });

    await folio.save();

    // If online payment was selected (e.g. Chapa, Telebirr, Card), create the verified Payment record
    let checkoutUrl: string | undefined;
    let txRef: string | undefined;

    if (paymentMethod === 'CHAPA') {
      const incomingOrigin = req.body.clientUrl || req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
      let clientUrl: string;
      if (incomingOrigin && !incomingOrigin.includes('localhost')) {
        clientUrl = incomingOrigin;
      } else if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
        clientUrl = process.env.CLIENT_URL;
      } else if (process.env.NODE_ENV === 'production') {
        clientUrl = 'https://grand-view-hotel.onrender.com';
      } else {
        clientUrl = incomingOrigin || process.env.CLIENT_URL || 'http://localhost:5173';
      }

      let serverUrl = process.env.SERVER_URL;
      if (!serverUrl || serverUrl.includes('localhost')) {
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
          serverUrl = 'https://grand-view-hotel-backend.vercel.app';
        } else {
          serverUrl = serverUrl || `http://localhost:${process.env.PORT || 5000}`;
        }
      }

      txRef = `tx-gvh-${bookingNumber.toLowerCase()}-${Date.now()}`;

      const payment = await PaymentService.initializePayment({
        folioId: folio._id.toString(),
        reservationId: reservation._id.toString(),
        guestId: guest._id.toString(),
        amount: total,
        paymentMethod: 'CHAPA',
        notes: `Chapa online payment for booking #${bookingNumber}`
      });

      payment.transactionId = txRef;
      await payment.save();

      try {
        const chapaSession = await ChapaService.initializeTransaction({
          amount: total,
          currency: 'ETB',
          email: guest.email || 'guest@grandviewhotel.com',
          firstName: guest.firstName || guest.fullName.split(' ')[0] || 'Guest',
          lastName: guest.lastName || guest.fullName.split(' ').slice(1).join(' ') || 'Customer',
          phone: guest.phone,
          txRef,
          callbackUrl: `${serverUrl}/api/public/chapa/callback/${txRef}`,
          returnUrl: `${clientUrl}/booking/confirmation/${bookingNumber}?chapa_tx_ref=${txRef}&status=success`,
          title: 'Grand View',
          description: `Room Stay ${bookingNumber}`,
          metadata: {
            reservationId: reservation._id.toString(),
            folioId: folio._id.toString()
          }
        });

        checkoutUrl = chapaSession.checkoutUrl;
        reservation.paymentGatewayReference = txRef;
        await reservation.save();
      } catch (chapaErr: any) {
        console.error('Chapa initialization error during booking:', chapaErr.message);
      }
    } else if (paymentMethod !== 'PAY_AT_HOTEL') {
      const payment = await PaymentService.initializePayment({
        folioId: folio._id.toString(),
        reservationId: reservation._id.toString(),
        guestId: guest._id.toString(),
        amount: total,
        paymentMethod: paymentMethod as any,
        notes: `Online booking payment via ${paymentMethod}`
      });

      await PaymentService.confirmPayment(payment._id.toString(), {
        providerReference: `${paymentMethod.toUpperCase()}-REF-${Date.now()}`
      });
    }

    // Emit PMS Notification for Receptionist & Hotel Manager
    await Notification.create({
      title: 'New Online Booking Received',
      message: `Booking #${bookingNumber} for ${guest.fullName} (${roomType.name}, ${nights} nights) - Payment: ${paymentMethod}`,
      type: 'NEW_ONLINE_BOOKING',
      referenceId: reservation._id.toString(),
      referenceModel: 'Reservation',
      targetRoles: ['HOTEL_MANAGER', 'RECEPTIONIST']
    });

    // Send confirmation email only for non-Chapa methods.
    // For Chapa payments, the confirmation email is sent after Chapa verification confirms payment success.
    if (paymentMethod !== 'CHAPA') {
      try {
        await EmailService.sendBookingConfirmation(reservation, guest, roomType);
      } catch (mailErr) {
        console.warn('Failed to send booking confirmation email:', mailErr);
      }
    }

    res.status(201).json({
      message: checkoutUrl ? 'Reservation created. Redirecting to Chapa payment...' : 'Reservation created successfully',
      checkoutUrl,
      txRef,
      booking: {
        bookingNumber: reservation.bookingNumber,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        nights: reservation.nights,
        adults: reservation.adults,
        children: reservation.children,
        roomType: {
          name: roomType.name,
          category: roomType.category,
          bedType: roomType.bedType,
          mealPlan: roomType.mealPlan
        },
        guest: {
          fullName: guest.fullName,
          email: guest.email,
          phone: guest.phone
        },
        pricing: reservation.pricing,
        paymentStatus: reservation.paymentStatus,
        paymentMethod: reservation.paymentMethod,
        status: reservation.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingNumber } = req.params;
    const reservation = await Reservation.findOne({ bookingNumber: bookingNumber.toUpperCase().trim() })
      .populate('guest')
      .populate('roomType')
      .populate('assignedRoom');

    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    res.json({ reservation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
