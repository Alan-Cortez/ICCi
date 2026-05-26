/**
 * Servidor API local para desarrollo (puerto 3000).
 * Vite hace proxy de /api → http://127.0.0.1:3000
 */
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env.local') });
dotenv.config({ path: join(root, '.env') });

const PORT = Number(process.env.API_PORT) || 3000;

function mount(app, method, path, handlerModule) {
  const run = async (req, res) => {
    try {
      const handler = (await import(handlerModule)).default;
      await handler(req, res);
    } catch (err) {
      console.error(`[API] ${method} ${path}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Error interno' });
      }
    }
  };
  app[method](path, run);
}

const app = express();
app.use(express.json({ limit: '10mb' }));

mount(app, 'get', '/api/init', '../api/init.js');
mount(app, 'post', '/api/init', '../api/init.js');
mount(app, 'post', '/api/auth/login', '../api/auth/login.js');
mount(app, 'get', '/api/auth/me', '../api/auth/me.js');
mount(app, 'post', '/api/auth/google', '../api/auth/google.js');
mount(app, 'post', '/api/auth/forgot-password', '../api/auth/forgot-password.js');
mount(app, 'post', '/api/auth/reset-password', '../api/auth/reset-password.js');
mount(app, 'post', '/api/execute', '../api/execute.js');
mount(app, 'get', '/api/check-birthdays', '../api/check-birthdays.js');
mount(app, 'post', '/api/check-birthdays', '../api/check-birthdays.js');

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API de desarrollo ICCI' });
});

app.listen(PORT, () => {
  console.log(`\n  API dev → http://127.0.0.1:${PORT}`);
  console.log('  Variables: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET');
  console.log('  (también acepta VITE_TURSO_* y VITE_JWT_SECRET en .env.local)\n');
});
