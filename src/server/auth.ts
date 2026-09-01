import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'eggnest-secret-jwt-key-2026';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'member' | 'admin';
  status: 'active' | 'inactive';
  farmId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// In-memory rate limiting map for login protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  if (now - entry.lastAttempt > windowMs) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count += 1;
  entry.lastAttempt = now;
  return true;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      farmId: user.farmId,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

// Middleware: Authenticate Token from Authorization: Bearer <token> or query param
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user exists and active in DB
    const userRow = db.prepare('SELECT id, full_name, phone, email, role, status, farm_id FROM users WHERE id = ?').get(decoded.id) as any;
    if (!userRow) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan atau sesi sudah kadaluarsa.' });
    }

    if (userRow.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan oleh administrator.' });
    }

    req.user = {
      id: userRow.id,
      fullName: userRow.full_name,
      phone: userRow.phone,
      email: userRow.email,
      role: userRow.role,
      status: userRow.status,
      farmId: userRow.farm_id,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi tidak valid atau telah kadaluarsa. Silakan login kembali.' });
  }
}

// Optional Auth (for public or hybrid endpoints)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userRow = db.prepare('SELECT id, full_name, phone, email, role, status, farm_id FROM users WHERE id = ?').get(decoded.id) as any;
      if (userRow && userRow.status === 'active') {
        req.user = {
          id: userRow.id,
          fullName: userRow.full_name,
          phone: userRow.phone,
          email: userRow.email,
          role: userRow.role,
          status: userRow.status,
          farmId: userRow.farm_id,
        };
      }
    } catch (err) {
      // ignore
    }
  }
  next();
}

// Middleware: Require Admin role (validated server-side)
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Endpoint ini hanya dapat diakses oleh Administrator Eggnest.',
    });
  }
  next();
}
