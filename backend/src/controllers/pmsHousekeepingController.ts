import { Response } from 'express';
import { HousekeepingTask, Room, User, GuestServiceRequest, Notification } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';

export const listHousekeepingTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { stage, priority, roomNumber } = req.query;
    const filter: any = {};

    if (stage && stage !== 'ALL') filter.stage = stage;
    if (priority && priority !== 'ALL') filter.priority = priority;

    const tasks = await HousekeepingTask.find(filter)
      .populate('room')
      .populate('assignedStaff', 'name email role')
      .populate('inspectedBy', 'name')
      .sort({ priority: -1, createdAt: -1 });

    // Summary counts for Kanban/Board
    const counts = {
      DIRTY: await HousekeepingTask.countDocuments({ stage: 'DIRTY' }),
      ASSIGNED: await HousekeepingTask.countDocuments({ stage: 'ASSIGNED' }),
      CLEANING: await HousekeepingTask.countDocuments({ stage: 'CLEANING' }),
      INSPECTED: await HousekeepingTask.countDocuments({ stage: 'INSPECTED' }),
      READY: await HousekeepingTask.countDocuments({ stage: 'READY' })
    };

    // In-room guest requests relevant to Housekeeping
    const guestRequests = await GuestServiceRequest.find({
      category: { $in: ['HOUSEKEEPING', 'DAY_FINISHED', 'AMENITIES'] }
    })
      .populate('room', 'roomNumber floor status cleanStatus')
      .populate('assignedStaff', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ counts, tasks, guestRequests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createHousekeepingTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId, taskType, priority = 'MEDIUM', assignedStaffId, notes } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const taskNumber = `HK-${Date.now().toString().slice(-5)}`;
    const task = new HousekeepingTask({
      taskNumber,
      room: room._id,
      taskType: taskType || 'STAYOVER_CLEAN',
      priority,
      stage: assignedStaffId ? 'ASSIGNED' : 'DIRTY',
      assignedStaff: assignedStaffId,
      notes
    });

    await task.save();

    // Mark room cleanStatus
    room.cleanStatus = 'DIRTY';
    if (room.status === 'AVAILABLE') {
      room.status = 'DIRTY';
    }
    await room.save();

    await logAuditAction(req, 'CREATE_HK_TASK', 'HousekeepingTask', task._id.toString(), `Created task #${taskNumber} for Room ${room.roomNumber}`);

    res.status(201).json({ message: 'Housekeeping task created', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stage, assignedStaffId, inspectedById, notes } = req.body;

    const task = await HousekeepingTask.findById(id).populate('room');
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    task.stage = stage;
    if (notes) task.notes = notes;
    if (assignedStaffId) task.assignedStaff = assignedStaffId;
    if (inspectedById) task.inspectedBy = inspectedById;

    const room = await Room.findById(task.room);

    if (stage === 'CLEANING') {
      task.startedAt = new Date();
      if (room && room.status !== 'OCCUPIED') {
        room.status = 'CLEANING';
        await room.save();
      }

      // Update linked guest service requests to IN_PROGRESS
      if (task.guestServiceRequest) {
        await GuestServiceRequest.findByIdAndUpdate(task.guestServiceRequest, {
          status: 'IN_PROGRESS'
        });
      } else if (task.room) {
        await GuestServiceRequest.updateMany(
          { room: task.room, status: 'PENDING', category: { $in: ['HOUSEKEEPING', 'DAY_FINISHED', 'AMENITIES'] } },
          { status: 'IN_PROGRESS' }
        );
      }
    } else if (stage === 'INSPECTED') {
      task.inspectedAt = new Date();
      task.inspectedBy = req.user?._id;
      if (room) {
        room.cleanStatus = 'INSPECTED';
        await room.save();
      }
    } else if (stage === 'READY') {
      task.completedAt = new Date();
      if (room) {
        room.cleanStatus = 'CLEAN';
        // Enforce hotel rule: when ready, vacant room becomes AVAILABLE
        if (room.status === 'DIRTY' || room.status === 'CLEANING') {
          room.status = 'AVAILABLE';
        }
        await room.save();
      }

      // Automatically complete linked and active GuestServiceRequests for this room
      const completedRequests: any[] = [];
      if (task.guestServiceRequest) {
        const reqItem = await GuestServiceRequest.findByIdAndUpdate(
          task.guestServiceRequest,
          { 
            status: 'COMPLETED', 
            completedAt: new Date(), 
            completedBy: req.user?._id 
          },
          { new: true }
        );
        if (reqItem) completedRequests.push(reqItem);
      }
      
      if (task.room) {
        const reqs = await GuestServiceRequest.find({
          room: task.room,
          status: { $in: ['PENDING', 'IN_PROGRESS'] },
          category: { $in: ['HOUSEKEEPING', 'DAY_FINISHED', 'AMENITIES'] }
        });
        for (const reqItem of reqs) {
          reqItem.status = 'COMPLETED';
          reqItem.completedAt = new Date();
          reqItem.completedBy = req.user?._id;
          await reqItem.save();
          if (!completedRequests.some(c => c._id.toString() === reqItem._id.toString())) {
            completedRequests.push(reqItem);
          }
        }
      }

      // Notify Reception & Front Desk that room request is completed and room is clean
      const roomNum = (room as any)?.roomNumber || 'Unknown';
      const requestText = completedRequests.length > 0 ? ` Completed request: "${completedRequests[0].item}".` : '';
      await Notification.create({
        title: `✨ Room ${roomNum} Cleaned & Completed`,
        message: `Housekeeping finished servicing Room ${roomNum}.${requestText} Room status is now CLEAN.`,
        type: 'ROOM_READY',
        referenceId: room ? room._id.toString() : undefined,
        referenceModel: 'Room',
        targetRoles: ['RECEPTIONIST', 'HOTEL_MANAGER'],
        isRead: false
      });
    }

    await task.save();

    await logAuditAction(
      req, 
      'UPDATE_HK_STAGE', 
      'HousekeepingTask', 
      task._id.toString(), 
      `Updated task #${task.taskNumber} stage to ${stage} for Room ${(room as any)?.roomNumber}`
    );

    res.json({ message: `Task stage updated to ${stage}`, task, room });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
