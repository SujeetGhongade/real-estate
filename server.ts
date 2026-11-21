import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.ts';
import publicRoutes from './src/routes/public.ts';
import userRoutes from './src/routes/user.ts';
import adminRoutes from './src/routes/admin.ts';
import { requireAuth } from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TO_EXT[file.mimetype] || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TO_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images under 5MB are allowed.'));
    }
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Secure uploaded image serving with strict path confinement
  app.get('/uploads/:filename', (req, res) => {
    const rawName = path.basename(req.params.filename || '');
    if (!/^[a-zA-Z0-9._-]+$/.test(rawName)) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }
    const resolved = path.resolve(UPLOADS_DIR, rawName);
    if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(resolved);
  });

  // Authenticated multi-image upload endpoint
  app.post('/api/uploads', requireAuth, (req, res) => {
    upload.array('images', 6)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Image upload failed.' });
      }
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        return res.status(400).json({ error: 'Please select at least one image.' });
      }
      const urls = files.map((f) => `/uploads/${f.filename}`);
      res.status(201).json({ urls });
    });
  });

  // API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite dev middleware or production static assets
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexaHome Real Estate running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
