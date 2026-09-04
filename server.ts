import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import apiRouter from './src/server/api';
import { getDb, persistDatabase } from './src/server/db';

async function startServer() {
  const app = express();

  // Railway akan memberikan PORT melalui environment variable.
  // Lokal tetap menggunakan 3000.
  const PORT = Number(process.env.PORT) || 3000;

  /*
   * =====================================================
   * BASIC MIDDLEWARE
   * =====================================================
   */

  app.use(express.json({ limit: '10mb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    })
  );

  /*
   * =====================================================
   * UPLOAD DIRECTORY
   * =====================================================
   */

  const uploadsDir = path.join(
    process.cwd(),
    'public',
    'uploads'
  );

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {
      recursive: true,
    });
  }

  app.use(
    '/uploads',
    express.static(uploadsDir)
  );

  /*
   * =====================================================
   * DATABASE
   * =====================================================
   */

  await getDb();

  console.log(
    '✅ SQLite Database Engine initialized successfully.'
  );

  /*
   * =====================================================
   * HEALTH CHECK
   * =====================================================
   */

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Eggnest Farm Hub Backend API',
    });
  });

  /*
   * =====================================================
   * API ROUTES
   * =====================================================
   */

  app.use('/api', apiRouter);

  /*
   * =====================================================
   * FRONTEND
   * =====================================================
   */

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(
      process.cwd(),
      'dist'
    );

    app.use(express.static(distPath));

    /*
     * SPA fallback.
     * Menggunakan middleware biasa agar lebih aman
     * dibanding app.get('*') pada Express versi baru.
     */
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      const indexPath = path.join(
        distPath,
        'index.html'
      );

      if (!fs.existsSync(indexPath)) {
        return res
          .status(404)
          .send('Frontend build not found.');
      }

      res.sendFile(indexPath);
    });
  }

  /*
   * =====================================================
   * DATABASE PERSISTENCE
   * =====================================================
   */

  const persistenceTimer = setInterval(() => {
    try {
      persistDatabase();
    } catch (error) {
      console.error(
        '❌ Failed to persist database:',
        error
      );
    }
  }, 10000);

  /*
   * =====================================================
   * GRACEFUL SHUTDOWN
   * =====================================================
   */

  const shutdown = (signal: string) => {
    console.log(
      `\n🛑 Received ${signal}. Saving database...`
    );

    clearInterval(persistenceTimer);

    try {
      persistDatabase();

      console.log(
        '✅ Database persisted successfully.'
      );
    } catch (error) {
      console.error(
        '❌ Failed to persist database during shutdown:',
        error
      );
    }

    process.exit(0);
  };

  process.on('SIGTERM', () =>
    shutdown('SIGTERM')
  );

  process.on('SIGINT', () =>
    shutdown('SIGINT')
  );

  /*
   * =====================================================
   * START SERVER
   * =====================================================
   */

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `🚀 Eggnest Farm Hub server running on port ${PORT}`
      );

      console.log(
        `🌐 Local: http://localhost:${PORT}`
      );
    }
  );
}

startServer().catch((error) => {
  console.error(
    '❌ Fatal error starting Eggnest Farm Hub server:',
    error
  );

  process.exit(1);
});