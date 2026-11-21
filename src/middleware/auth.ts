import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifySessionToken } from '../lib/security.ts';

const OWNER_ADMIN_EMAIL = 'sujeetghongade7@gmail.com';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isBlocked: boolean;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

export async function getOrCreateFirebaseUser(
  uid: string,
  email: string,
  name?: string,
  avatarUrl?: string
): Promise<AuthenticatedUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || normalizedEmail.split('@')[0] || 'NexaHome User';
  const isOwner = normalizedEmail === OWNER_ADMIN_EMAIL;

  try {
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingByEmail.length > 0) {
      const existing = existingByEmail[0];
      const nextRole = isOwner ? 'admin' : existing.role;
      const updated = await db
        .update(users)
        .set({
          uid,
          name: existing.name || displayName,
          avatarUrl: avatarUrl || existing.avatarUrl,
          role: nextRole,
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        name: displayName,
        avatarUrl: avatarUrl || null,
        role: isOwner ? 'admin' : 'user',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          name: displayName,
          avatarUrl: avatarUrl || null,
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query failed while syncing user:', error);
    throw new Error('Authentication sync failed. Please try again.', { cause: error });
  }
}

async function resolveUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Check custom signed session token (email/password or admin claim login)
  if (token.startsWith('nh.')) {
    const payload = verifySessionToken(token);
    if (!payload) return null;
    const found = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    return found[0] || null;
  }

  // 2. Otherwise verify Firebase ID token
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email) return null;
    return await getOrCreateFirebaseUser(
      decoded.uid,
      decoded.email,
      decoded.name,
      decoded.picture
    );
  } catch {
    return null;
  }
}

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice(7).trim();
  if (!token) return next();

  try {
    const user = await resolveUserFromToken(token);
    if (user && !user.isBlocked) {
      req.authUser = user;
    }
  } catch (err) {
    console.error('Optional auth verification error:', err);
  }
  next();
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  const token = authHeader.slice(7).trim();
  try {
    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    req.authUser = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await requireAuth(req, res, () => {
    if (!req.authUser || req.authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access is required.' });
    }
    next();
  });
};
