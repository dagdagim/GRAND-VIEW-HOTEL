import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hotel_pms_key_2026_jwt_token_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        avatar: req.user.avatar
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const staff = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      status: 'success',
      data: { staff },
      staff
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }

    const newUser = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      phone
    });
    await newUser.save();

    await logAuditAction(req, 'CREATE_STAFF', 'User', newUser._id.toString(), `Created staff ${newUser.name} with role ${newUser.role}`);

    res.status(201).json({
      status: 'success',
      message: 'Staff member created successfully',
      data: { staff: newUser },
      staff: newUser
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStaffStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'Staff member not found.' });
      return;
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    await user.save();

    await logAuditAction(req, 'UPDATE_STAFF', 'User', user._id.toString(), `Updated staff status for ${user.name}`);

    res.json({
      status: 'success',
      message: 'Staff member updated successfully',
      data: { staff: user },
      staff: user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
