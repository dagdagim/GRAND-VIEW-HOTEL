import { Room, RoomType, Reservation, MaintenanceTicket } from '../models/index.js';
import { Types } from 'mongoose';

export interface RoomTypeAvailability {
  roomTypeId: string;
  code: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  sizeSquareMeters: number;
  amenities: string[];
  features: string[];
  mealPlan: string;
  cancellationPolicy: string;
  images: string[];
  totalRooms: number;
  availableRoomsCount: number;
  availableRoomIds: string[];
}

export class AvailabilityService {
  /**
   * Check room availability across all room types for a specific date range and guest count
   */
  public static async getAvailabilityForDateRange(
    checkInDate: Date,
    checkOutDate: Date,
    guests: number = 1
  ): Promise<RoomTypeAvailability[]> {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // 1. Get all active room types
    const roomTypes = await RoomType.find({ isActive: true }).sort({ displayOrder: 1 });

    // 2. Get all active rooms
    const allRooms = await Room.find({ isActive: true, status: { $ne: 'OUT_OF_SERVICE' } });

    // 3. Find rooms currently blocked by critical maintenance tickets
    const blockedTickets = await MaintenanceTicket.find({
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      blockRoomFromBooking: true,
      room: { $exists: true, $ne: null }
    });
    const blockedRoomIds = new Set(blockedTickets.map(t => t.room?.toString()));

    // 4. Find all active reservations overlapping with [checkIn, checkOut)
    // Overlap formula: res.checkInDate < checkOut && res.checkOutDate > checkIn
    const overlappingReservations = await Reservation.find({
      status: { $in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn }
    });

    const bookedRoomIds = new Set<string>();
    // Track unassigned reservations by roomType
    const unassignedCountByRoomType: Record<string, number> = {};

    for (const res of overlappingReservations) {
      if (res.assignedRoom) {
        bookedRoomIds.add(res.assignedRoom.toString());
      } else {
        const rtId = res.roomType.toString();
        unassignedCountByRoomType[rtId] = (unassignedCountByRoomType[rtId] || 0) + 1;
      }
    }

    const results: RoomTypeAvailability[] = [];

    for (const rt of roomTypes) {
      if (rt.maxOccupancy < guests) {
        // Skip if room cannot hold the requested guest count
        continue;
      }

      const rtId = rt._id.toString();
      // All rooms belonging to this type that are not out-of-service and not blocked by maintenance
      const roomsForType = allRooms.filter(
        r => r.roomType.toString() === rtId && !blockedRoomIds.has(r._id.toString())
      );

      // Available individual rooms (not explicitly booked)
      const availableRooms = roomsForType.filter(r => !bookedRoomIds.has(r._id.toString()));

      // Deduct unassigned reservations for this room type
      const unassignedBookings = unassignedCountByRoomType[rtId] || 0;
      const netAvailableCount = Math.max(0, availableRooms.length - unassignedBookings);

      results.push({
        roomTypeId: rtId,
        code: rt.code,
        name: rt.name,
        category: rt.category,
        description: rt.description,
        shortDescription: rt.shortDescription,
        basePrice: rt.basePrice,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        bedType: rt.bedType,
        sizeSquareMeters: rt.sizeSquareMeters,
        amenities: rt.amenities,
        features: rt.features,
        mealPlan: rt.mealPlan,
        cancellationPolicy: rt.cancellationPolicy,
        images: rt.images,
        totalRooms: roomsForType.length,
        availableRoomsCount: netAvailableCount,
        availableRoomIds: availableRooms.slice(0, netAvailableCount).map(r => r._id.toString())
      });
    }

    return results;
  }

  /**
   * Verify if a specific room is available for given dates
   */
  public static async isRoomAvailable(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeReservationId?: string
  ): Promise<boolean> {
    const room = await Room.findById(roomId);
    if (!room || !room.isActive || room.status === 'OUT_OF_SERVICE') {
      return false;
    }

    // Check maintenance block
    const maintenanceBlock = await MaintenanceTicket.findOne({
      room: roomId,
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      blockRoomFromBooking: true
    });
    if (maintenanceBlock) return false;

    // Check overlapping reservations for this specific room
    const query: any = {
      assignedRoom: roomId,
      status: { $in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate }
    };

    if (excludeReservationId) {
      query._id = { $ne: new Types.ObjectId(excludeReservationId) };
    }

    const overlap = await Reservation.findOne(query);
    return !overlap;
  }

  /**
   * Find first available room for a room type and date range
   */
  public static async findAvailableRoomForType(
    roomTypeId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<string | null> {
    const rooms = await Room.find({
      roomType: roomTypeId,
      isActive: true,
      status: { $nin: ['OUT_OF_SERVICE', 'MAINTENANCE'] }
    }).sort({ roomNumber: 1 });

    for (const room of rooms) {
      const isFree = await this.isRoomAvailable(room._id.toString(), checkInDate, checkOutDate);
      if (isFree) {
        return room._id.toString();
      }
    }

    return null;
  }
}
