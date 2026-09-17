import { Response } from 'express';
import { MaintenanceTicket, Room, GuestServiceRequest, Notification, User } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';

export const listMaintenanceTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, category } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (category && category !== 'ALL') filter.category = category;

    const tickets = await MaintenanceTicket.find(filter)
      .populate('room')
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    const counts = {
      OPEN: await MaintenanceTicket.countDocuments({ status: 'OPEN' }),
      ASSIGNED: await MaintenanceTicket.countDocuments({ status: 'ASSIGNED' }),
      IN_PROGRESS: await MaintenanceTicket.countDocuments({ status: 'IN_PROGRESS' }),
      RESOLVED: await MaintenanceTicket.countDocuments({ status: 'RESOLVED' }),
      CLOSED: await MaintenanceTicket.countDocuments({ status: 'CLOSED' })
    };

    // In-room guest requests relevant to Maintenance / Engineering
    const guestRequests = await GuestServiceRequest.find({
      category: 'MAINTENANCE'
    })
      .populate('room', 'roomNumber floor status cleanStatus')
      .populate('assignedStaff', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ counts, tickets, guestRequests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createMaintenanceTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      roomId,
      facilityArea,
      issueTitle,
      description,
      category = 'PLUMBING',
      priority = 'MEDIUM',
      blockRoomFromBooking = false,
      assignedTo
    } = req.body;

    const ticketNumber = `MNT-${Date.now().toString().slice(-5)}`;

    const ticket = new MaintenanceTicket({
      ticketNumber,
      room: roomId || undefined,
      facilityArea,
      issueTitle,
      description,
      category,
      priority,
      status: assignedTo ? 'ASSIGNED' : 'OPEN',
      blockRoomFromBooking: !!blockRoomFromBooking,
      reportedBy: req.user?._id,
      assignedTo: assignedTo || undefined
    });

    await ticket.save();

    if (roomId && blockRoomFromBooking) {
      const room = await Room.findById(roomId);
      if (room && room.status !== 'OCCUPIED') {
        room.status = 'MAINTENANCE';
        await room.save();
      }
    }

    await logAuditAction(req, 'CREATE_MAINTENANCE_TICKET', 'MaintenanceTicket', ticket._id.toString(), `Created ticket #${ticketNumber}: ${issueTitle}`);

    res.status(201).json({ message: 'Maintenance ticket created', ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMaintenanceTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes, cost } = req.body;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (status) ticket.status = status;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (cost !== undefined) ticket.cost = Number(cost);

    if (status === 'RESOLVED' || status === 'CLOSED') {
      ticket.resolvedAt = new Date();
      if (status === 'CLOSED') ticket.closedAt = new Date();

      // If room was blocked by maintenance, restore room status
      if (ticket.room && ticket.blockRoomFromBooking) {
        const room = await Room.findById(ticket.room);
        if (room && room.status === 'MAINTENANCE') {
          room.status = 'DIRTY'; // Needs touchup/inspection before guests enter
          room.cleanStatus = 'DIRTY';
          await room.save();
        }
      }
    }

    await ticket.save();

    await logAuditAction(req, 'UPDATE_MAINTENANCE_TICKET', 'MaintenanceTicket', ticket._id.toString(), `Updated ticket #${ticket.ticketNumber} to ${ticket.status}`);

    res.json({ message: 'Ticket updated', ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const dispatchGuestRequestToMaintenance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      request.assignedStaffName = staffUser?.name || 'Technician';
    }
    await request.save();

    // Create or link MaintenanceTicket
    const ticketNumber = `MNT-REQ-${Date.now().toString().slice(-4)}`;
    const ticket = await MaintenanceTicket.create({
      ticketNumber,
      room: (request.room as any)?._id || request.room,
      issueTitle: request.item,
      description: `In-room guest request from Room ${request.roomNumber}: ${request.item}. Notes: ${staffNotes || request.specialInstructions || 'None'}`,
      category: 'PLUMBING',
      priority: request.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
      status: assignedStaffId ? 'ASSIGNED' : 'IN_PROGRESS',
      reportedBy: req.user?._id,
      assignedTo: assignedStaffId || undefined
    });

    await logAuditAction(
      req,
      'DISPATCH_MAINTENANCE_REQUEST',
      'GuestServiceRequest',
      request._id.toString(),
      `Dispatched guest maintenance request "${request.item}" for Room ${request.roomNumber} (Assigned: ${request.assignedStaffName || 'Team Queue'})`
    );

    res.json({
      message: `Maintenance request for Room ${request.roomNumber} dispatched successfully!`,
      request,
      ticket
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveGuestMaintenanceRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const request = await GuestServiceRequest.findById(id).populate('room');
    if (!request) {
      res.status(404).json({ error: 'Guest service request not found' });
      return;
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    request.completedBy = req.user?._id;
    await request.save();

    // Mark any linked Maintenance tickets as RESOLVED
    if (request.room) {
      await MaintenanceTicket.updateMany(
        { room: (request.room as any)?._id || request.room, status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } },
        { status: 'RESOLVED', resolvedAt: new Date(), resolutionNotes: resolutionNotes || 'Repaired by engineering staff' }
      );
    }

    // Send PMS Notification to Reception & Hotel Manager
    const roomNum = request.roomNumber || (request.room as any)?.roomNumber || 'Unknown';
    await Notification.create({
      title: `🔧 Room ${roomNum} Maintenance Resolved`,
      message: `Engineering completed maintenance for Room ${roomNum}: "${request.item}".`,
      type: 'ROOM_READY',
      referenceId: request.room ? (request.room as any)?._id?.toString() || request.room.toString() : undefined,
      referenceModel: 'Room',
      targetRoles: ['RECEPTIONIST', 'HOTEL_MANAGER'],
      isRead: false
    });

    await logAuditAction(
      req,
      'RESOLVE_GUEST_MAINTENANCE',
      'GuestServiceRequest',
      request._id.toString(),
      `Resolved guest maintenance request "${request.item}" for Room ${roomNum}`
    );

    res.json({
      message: `Maintenance request for Room ${roomNum} resolved and completed!`,
      request
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
