// Servicio de email usando EmailJS REST API
// Credenciales de EmailJS — configura en https://www.emailjs.com
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

const ADMIN_EMAIL = 'alancortez9966@gmail.com';

/**
 * Envía un correo al admin cuando llega una solicitud de aprobación.
 * Falla silenciosamente si EmailJS no está configurado.
 */
export const sendApprovalRequestEmail = async ({ actionLabel, requestedBy, ministryName = 'Jóvenes' }) => {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.warn('⚠️ EmailJS no configurado. El correo no será enviado.');
        return;
    }

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: {
                    to_email: ADMIN_EMAIL,
                    to_name: 'Alan (Administrador)',
                    from_name: requestedBy,
                    ministry_name: ministryName,
                    action_label: actionLabel,
                    app_url: 'https://icci.vercel.app',
                    date: new Date().toLocaleString('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                    })
                }
            })
        });

        if (response.ok) {
            console.log('📧 Correo de notificación enviado al administrador');
        } else {
            console.warn('⚠️ Error al enviar correo:', response.statusText);
        }
    } catch (error) {
        console.warn('⚠️ No se pudo enviar correo de notificación:', error.message);
    }
};
