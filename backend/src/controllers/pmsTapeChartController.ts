import { Response } from 'express';
import { Room, Reservation } from '../models/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getTapeChartData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate: startStr, days = 14 } = req.query;

    const startDate = startStr ? new Date(startStr as string) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const numDays = Math.min(60, Math.max(7, Number(days)));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + numDays);
    endDate.setHours(23, 59, 59, 999);

    // Generate date columns
    const dateHeaders = [];
    const curr = new Date(startDate);
    for (let i = 0; i < numDays; i++) {
      dateHeaders.push({
        dateStr: curr.toISOString().split('T')[0],
        dayName: curr.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: curr.getDate(),
        monthName: curr.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: curr.getDay() === 0 || curr.getDay() === 6
      });
      curr.setDate(curr.getDate() + 1);
    }

    // Fetch all active rooms
    const rooms = await Room.find({ isActive: true })
      .populate('roomType')
      .sort({ floor: 1, roomNumber: 1 });

    // Fetch reservations in range
    const reservations = await Reservation.find({
      status: { $in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      checkInDate: { $lt: endDate },
      checkOutDate: { $gt: startDate }
    })
      .populate('guest')
      .populate('roomType');

    // Index reservations by assigned room ID
    const reservationsByRoom: Record<string, any[]> = {};
    const unassignedReservations: any[] = [];

    for (const res of reservations) {
      if (res.assignedRoom) {
        const rId = res.assignedRoom.toString();
        if (!reservationsByRoom[rId]) reservationsByRoom[rId] = [];
        reservationsByRoom[rId].push(res);
      } else {
        unassignedReservations.push(res);
      }
    }

    res.json({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days: numDays,
      dateHeaders,
      rooms: rooms.map(room => ({
        _id: room._id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        status: room.status,
        cleanStatus: room.cleanStatus,
        bookings: reservationsByRoom[room._id.toString()] || []
      })),
      unassignedReservations
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
