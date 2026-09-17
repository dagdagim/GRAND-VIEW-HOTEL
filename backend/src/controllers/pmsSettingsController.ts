import { Response } from 'express';
import { HotelSettings, AuditLog, Notification } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';

export const getHotelSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

export const updateHotelSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updateData = req.body;
    let settings = await HotelSettings.findOne();
    if (!settings) {
      settings = new HotelSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    await settings.save();

    await logAuditAction(req, 'UPDATE_SETTINGS', 'HotelSettings', settings._id.toString(), 'Updated hotel configuration and policies');

    res.json({ message: 'Hotel settings updated successfully', settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { resource, action, limit = 100 } = req.query;
    const filter: any = {};
    if (resource && resource !== 'ALL') filter.resource = resource;
    if (action && action !== 'ALL') filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role || 'RECEPTIONIST';
    const notifications = await Notification.find({
      $or: [
        { targetRoles: userRole },
        { targetRoles: { $size: 0 } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      isRead: false,
      $or: [
        { targetRoles: userRole },
        { targetRoles: { $size: 0 } }
      ]
    });

    res.json({ unreadCount, notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
