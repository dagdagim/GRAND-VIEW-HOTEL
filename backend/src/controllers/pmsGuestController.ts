import { Response } from 'express';
import { Guest, Reservation, Stay, Folio } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';

export const listGuests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, vipLevel, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (vipLevel && vipLevel !== 'ALL') {
      filter.vipLevel = vipLevel;
    }

    if (search) {
      const regex = new RegExp(search as string, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { nationality: regex },
        { idNumber: regex }
      ];
    }

    const total = await Guest.countDocuments(filter);
    const guests = await Guest.find(filter)
      .sort({ totalStays: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ total, page: Number(page), guests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGuestProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id);
    if (!guest) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    const reservations = await Reservation.find({ guest: id })
      .populate('roomType')
      .populate('assignedRoom')
      .sort({ checkInDate: -1 });

    const stays = await Stay.find({ guest: id })
      .populate('room')
      .populate('roomType')
      .sort({ checkInTime: -1 });

    const folios = await Folio.find({ guest: id }).sort({ createdAt: -1 });

    res.json({ guest, reservations, stays, folios });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGuest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const guest = await Guest.findByIdAndUpdate(id, updateData, { new: true });
    if (!guest) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    await logAuditAction(req, 'UPDATE_GUEST', 'Guest', guest._id.toString(), `Updated guest profile for ${guest.fullName}`);

    res.json({ message: 'Guest updated successfully', guest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createGuest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const guestData = req.body;
    const guest = new Guest(guestData);
    await guest.save();

    await logAuditAction(req, 'CREATE_GUEST', 'Guest', guest._id.toString(), `Created guest ${guest.fullName}`);

    res.status(201).json({ message: 'Guest created successfully', guest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
