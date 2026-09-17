import { Response } from 'express';
import { Room, RoomType } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';

export const listRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { floor, status, roomType, search } = req.query;
    const filter: any = { isActive: true };

    if (floor) filter.floor = Number(floor);
    if (status && status !== 'ALL') filter.status = status;
    if (roomType && roomType !== 'ALL') filter.roomType = roomType;
    if (search) {
      filter.roomNumber = { $regex: search as string, $options: 'i' };
    }

    const rooms = await Room.find(filter)
      .populate('roomType')
      .populate({
        path: 'currentStay',
        populate: [{ path: 'guest' }, { path: 'reservation' }]
      })
      .sort({ floor: 1, roomNumber: 1 });

    res.json({ rooms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber, floor, roomType, keyCardCode, isSmoking, notes } = req.body;

    const existing = await Room.findOne({ roomNumber });
    if (existing) {
      res.status(400).json({ error: `Room ${roomNumber} already exists.` });
      return;
    }

    const room = new Room({
      roomNumber,
      floor,
      roomType,
      keyCardCode,
      isSmoking: !!isSmoking,
      notes,
      status: 'AVAILABLE',
      cleanStatus: 'CLEAN'
    });
    await room.save();

    await logAuditAction(req, 'CREATE_ROOM', 'Room', room._id.toString(), `Created Room ${room.roomNumber}`);

    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoomStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, cleanStatus, notes } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const oldStatus = room.status;
    if (status) room.status = status;
    if (cleanStatus) room.cleanStatus = cleanStatus;
    if (notes !== undefined) room.notes = notes;

    await room.save();

    const { HousekeepingTask } = await import('../models/index.js');
    if (status === 'CLEANING') {
      await HousekeepingTask.updateMany(
        { room: room._id, stage: { $in: ['DIRTY', 'ASSIGNED'] } },
        { stage: 'CLEANING', startedAt: new Date() }
      );
    } else if (cleanStatus === 'CLEAN' || status === 'AVAILABLE') {
      await HousekeepingTask.updateMany(
        { room: room._id, stage: { $ne: 'READY' } },
        { stage: 'READY', completedAt: new Date() }
      );
    }

    await logAuditAction(
      req, 
      'UPDATE_ROOM_STATUS', 
      'Room', 
      room._id.toString(), 
      `Changed Room ${room.roomNumber} status from ${oldStatus} to ${room.status} (Clean: ${room.cleanStatus})`
    );

    res.json({ message: 'Room status updated successfully', room });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listRoomTypes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roomTypes = await RoomType.find().sort({ displayOrder: 1 });
    res.json({ roomTypes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoomType = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const roomType = await RoomType.findByIdAndUpdate(id, updateData, { new: true });
    if (!roomType) {
      res.status(404).json({ error: 'Room type not found' });
      return;
    }

    await logAuditAction(req, 'UPDATE_ROOM_TYPE', 'RoomType', roomType._id.toString(), `Updated room type ${roomType.name}`);

    res.json({ message: 'Room type updated', roomType });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
