# Seguridad ICCI

## Cambios implementados

- La base de datos **solo** se accede desde funciones en `/api` (Vercel).
- Login con **JWT** (7 días) y contraseñas **bcrypt**; las contraseñas en texto plano se migran al iniciar sesión.
- Eliminados tokens y contraseñas hardcodeados del código fuente.
- Cron de cumpleaños protegido con `CRON_SECRET`.

## Configuración en Vercel

1. Copia `.env.example` y configura en **Project → Settings → Environment Variables**:

| Variable | Dónde |
|----------|--------|
| `TURSO_DATABASE_URL` | Servidor |
| `TURSO_AUTH_TOKEN` | Servidor (rotar si estuvo en el repo) |
| `JWT_SECRET` | Servidor (mín. 32 caracteres aleatorios) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Servidor (solo primer despliegue sin usuarios) |
| `CRON_SECRET` | Servidor |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Servidor |
| `VITE_VAPID_PUBLIC_KEY` | Cliente (misma clave pública que arriba) |

2. **Rota** el token de Turso y las claves VAPID si alguna vez estuvieron en GitHub.

3. Cambia las contraseñas de usuarios que estaban en texto plano en la base de datos.

## Desarrollo local

1. Copia `.env.example` → `.env.local` y completa Turso + `JWT_SECRET`.
2. Ejecuta:

```bash
npm run dev
```

Eso inicia la **API en el puerto 3000** y **Vite en el 5173** (con proxy `/api`).

Alternativa con Vercel CLI: `npm run dev:full`

## Cron en Vercel

En el cron job, añade el header:

`Authorization: Bearer <CRON_SECRET>`

(o `x-cron-secret: <CRON_SECRET>`).
