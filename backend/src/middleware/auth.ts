import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole, AuditLog } from '../models/index.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hotel_pms_key_2026_jwt_token_secure';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or account is deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Please login.' });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // Super admin has full clearance
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}` 
      });
      return;
    }

    next();
  };
};

export const logAuditAction = async (
  req: AuthenticatedRequest,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
): Promise<void> => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'System / Public',
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.socket.remoteAddress
    });
  } catch (e) {
    console.error('Audit logging failed:', e);
  }
};
