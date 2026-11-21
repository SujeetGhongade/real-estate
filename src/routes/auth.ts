import { Router } from 'express';
import crypto from 'crypto';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users, activityLogs } from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  isValidEmail,
  timingSafeCompareStrings,
} from '../lib/security.ts';

const router = Router();

// Check whether password-based admin access is already claimed or configured via env
router.get('/admin-status', async (_req, res) => {
  try {
    const envPasscodeSet = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
    const passwordAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'admin'), isNotNull(users.passwordHash)))
      .limit(1);

    res.json({
      hasEnvPasscode: envPasscodeSet,
      hasPasswordAdmin: passwordAdmins.length > 0,
      needsFirstRunClaim: !envPasscodeSet && passwordAdmins.length === 0,
    });
  } catch (error) {
    console.error('Failed to check admin status:', error);
    res.status(500).json({ error: 'Unable to check admin status.' });
  }
});

// One-time atomic first-run admin claim form when ADMIN_PASSCODE env is unset and no password admin exists
router.post('/admin-claim', async (req, res) => {
  try {
    if (process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0) {
      return res.status(403).json({ error: 'Admin passcode is managed via server environment settings.' });
    }

    const existingPasswordAdmin = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'admin'), isNotNull(users.passwordHash)))
      .limit(1);

    if (existingPasswordAdmin.length > 0) {
      return res.status(409).json({ error: 'Admin credentials have already been claimed. Please sign in.' });
    }

    const email = String(req.body?.email || 'admin@nexahome.pk').trim().toLowerCase();
    const name = String(req.body?.name || 'NexaHome Administrator').trim();
    const password = String(req.body?.password || '');

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid admin email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
    }

    const passwordHash = hashPassword(password);
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let adminUser;
    if (existingUser.length > 0) {
      const updated = await db
        .update(users)
        .set({ role: 'admin', passwordHash, name: name || existingUser[0].name, isBlocked: false })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      adminUser = updated[0];
    } else {
      const inserted = await db
        .insert(users)
        .values({
          uid: `local_${crypto.randomUUID()}`,
          email,
          name: name || 'NexaHome Administrator',
          passwordHash,
          role: 'admin',
        })
        .returning();
      adminUser = inserted[0];
    }

    await db.insert(activityLogs).values({
      actorEmail: adminUser.email,
      action: 'ADMIN_CLAIM',
      entityType: 'user',
      entityId: String(adminUser.id),
      details: 'First-run administrator password configured.',
    });

    const token = signSessionToken({
      userId: adminUser.id,
      uid: adminUser.uid,
      email: adminUser.email,
      role: adminUser.role,
    });

    res.status(201).json({
      token,
      user: {
        id: adminUser.id,
        uid: adminUser.uid,
        email: adminUser.email,
        name: adminUser.name,
        phone: adminUser.phone,
        avatarUrl: adminUser.avatarUrl,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('Admin claim error:', error);
    res.status(500).json({ error: 'Failed to configure admin account.' });
  }
});

// Standard user signup
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');

    if (name.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const inserted = await db
      .insert(users)
      .values({
        uid: `local_${crypto.randomUUID()}`,
        email,
        name,
        phone: phone || null,
        passwordHash: hashPassword(password),
        role: 'user',
      })
      .returning();

    const user = inserted[0];
    const token = signSessionToken({
      userId: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Email/password login (supports env ADMIN_PASSCODE override for admin account)
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // If ADMIN_PASSCODE env is set and matches for admin@nexahome.pk or an existing admin
    if (envPasscode && timingSafeCompareStrings(password, envPasscode)) {
      if (found.length > 0 && found[0].role === 'admin') {
        const admin = found[0];
        const token = signSessionToken({
          userId: admin.id,
          uid: admin.uid,
          email: admin.email,
          role: 'admin',
        });
        return res.json({
          token,
          user: {
            id: admin.id,
            uid: admin.uid,
            email: admin.email,
            name: admin.name,
            phone: admin.phone,
            avatarUrl: admin.avatarUrl,
            role: admin.role,
          },
        });
      }
      if (email === 'admin@nexahome.pk') {
        const inserted = await db
          .insert(users)
          .values({
            uid: `local_${crypto.randomUUID()}`,
            email: 'admin@nexahome.pk',
            name: 'NexaHome Administrator',
            role: 'admin',
          })
          .onConflictDoUpdate({
            target: users.email,
            set: { role: 'admin', isBlocked: false },
          })
          .returning();
        const admin = inserted[0];
        const token = signSessionToken({
          userId: admin.id,
          uid: admin.uid,
          email: admin.email,
          role: 'admin',
        });
        return res.json({
          token,
          user: {
            id: admin.id,
            uid: admin.uid,
            email: admin.email,
            name: admin.name,
            phone: admin.phone,
            avatarUrl: admin.avatarUrl,
            role: admin.role,
          },
        });
      }
    }

    const user = found[0];
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signSessionToken({
      userId: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

// Sync or fetch current authenticated user (works for both Firebase Google tokens & custom session tokens)
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = req.authUser!;
  res.json({
    user: {
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });
});

// Update profile
router.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.authUser!;
    const name = String(req.body?.name || user.name).trim();
    const phone = String(req.body?.phone || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }

    const updated = await db
      .update(users)
      .set({ name, phone: phone || null })
      .where(eq(users.id, user.id))
      .returning();

    res.json({
      user: {
        id: updated[0].id,
        uid: updated[0].uid,
        email: updated[0].email,
        name: updated[0].name,
        phone: updated[0].phone,
        avatarUrl: updated[0].avatarUrl,
        role: updated[0].role,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password (for email/password users or admins)
router.post('/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.authUser!;
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!dbUser.length) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (dbUser[0].passwordHash) {
      if (!verifyPassword(currentPassword, dbUser[0].passwordHash)) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, user.id));

    await db.insert(activityLogs).values({
      actorEmail: user.email,
      action: 'CHANGE_PASSWORD',
      entityType: 'user',
      entityId: String(user.id),
      details: 'Password updated successfully.',
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
