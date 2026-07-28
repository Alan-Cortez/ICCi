/**
 * Utilidad para enviar correos electrónicos via SMTP (nodemailer).
 * Configura las variables de entorno SMTP_* en .env.local para activarlo.
 */
import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    throw new Error(
      'Email no configurado. Añade SMTP_HOST, SMTP_USER y SMTP_PASS en .env.local'
    );
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    from,
  };
}

/**
 * Envía un correo de restablecimiento de contraseña.
 * @param {string} toEmail - Destinatario
 * @param {string} resetToken - Token único de restablecimiento
 * @param {string} baseUrl - URL base de la app (ej. https://app.com)
 */
export async function sendPasswordResetEmail(toEmail, resetToken, baseUrl) {
  const { transporter, from } = getTransporter();

  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const expiresIn = '30 minutos';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer contraseña - ICCi</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:36px 32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                  🔐 ICCi — Restablecer Contraseña
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 32px;">
                <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                </p>
                <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
                  Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expira en <strong>${expiresIn}</strong>.
                </p>
                <div style="text-align:center;margin-bottom:28px;">
                  <a href="${resetLink}"
                     style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                    Restablecer Contraseña
                  </a>
                </div>
                <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                  Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin:0;word-break:break-all;">
                  <a href="${resetLink}" style="color:#2563eb;font-size:12px;">${resetLink}</a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
                <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                  Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará.<br>
                  © ${new Date().getFullYear()} ICCi — Sistema de Gestión de Iglesia
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"ICCi Sistema" <${from}>`,
    to: toEmail,
    subject: '🔐 Restablecer tu contraseña de ICCi',
    html,
    text: `Restablece tu contraseña usando este enlace (expira en ${expiresIn}):\n\n${resetLink}\n\nSi no solicitaste esto, ignora este correo.`,
  });
}
