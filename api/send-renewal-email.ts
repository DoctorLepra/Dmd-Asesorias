import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface RenewalEmailPayload {
  to: string;
  clientName: string;
  identificacion: string;
  renewalType: 'licencia' | 'poliza';
  newExpiryDate: string;
  licenseDetails?: {
    sistema?: string;
    numero_licencia?: string;
    codigo_producto?: string;
  };
}

const BANNER_POLIZA_URL =
  'https://resend-attachments.s3.amazonaws.com/MrA4NkZHctnZswmig98TYx/58c02ba2-4fcc-4886-94ff-38fc4b2f0154';
const BANNER_LICENCIA_URL =
  'https://resend-attachments.s3.amazonaws.com/MrA4NkZHctnZswmig98TYx/88ea283c-0c94-4f37-a53c-067071cf65a3';
const FOOTER_LOGO_URL =
  'https://resend-attachments.s3.amazonaws.com/MrA4NkZHctnZswmig98TYx/ba97c8a0-d32a-4a2b-8191-afdf79c00cff';

export function buildRenewalEmailHtml(payload: RenewalEmailPayload): { subject: string; html: string } {
  const { clientName, identificacion, renewalType, newExpiryDate, licenseDetails } = payload;

  const formattedDate = newExpiryDate
    ? new Date(`${newExpiryDate}T00:00:00`)
        .toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        .replace(/ de ([a-záéíóúñ])/i, (_, letter) => ` de ${letter.toUpperCase()}`)
    : newExpiryDate;

  const isLicencia = renewalType === 'licencia';
  const sistema = licenseDetails?.sistema || 'ContaPyme';
  const numeroLicencia = licenseDetails?.numero_licencia || 'N/A';
  const codigoProducto = licenseDetails?.codigo_producto || '';

  const bannerUrl = isLicencia ? BANNER_LICENCIA_URL : BANNER_POLIZA_URL;
  const bannerAlt = isLicencia
    ? 'Banner con texto en español que anuncia ¡Tu Licencia se ha renovado! y muestra el logotipo de DMD Asesorías'
    : 'Banner con texto en español que anuncia ¡Tu Póliza se ha renovado! y muestra el logotipo de DMD Asesorías';

  const subject = isLicencia
    ? `Confirmación de Renovación de Licencia ${sistema} - DMD Asesorías`
    : `Confirmación de Renovación de Póliza - DMD Asesorías`;

  const introMessage = isLicencia
    ? `Te informamos que la renovación de tu licencia de <strong>${sistema}</strong> ha sido procesada exitosamente.`
    : `Te informamos que la renovación de tu póliza ha sido procesada exitosamente.`;

  const detailInfoHtml = isLicencia
    ? `
      <tr>
        <td align="left" style="padding:14px 0 4px 0;font-size:15px;color:#0f172a;">
          <strong>Sistema:</strong> ${sistema}
        </td>
      </tr>
      <tr>
        <td align="left" style="padding:4px 0;font-size:15px;color:#0f172a;">
          <strong>Número de licencia:</strong> ${numeroLicencia}
        </td>
      </tr>
      ${
        codigoProducto
          ? `
      <tr>
        <td align="left" style="padding:4px 0;font-size:15px;color:#0f172a;">
          <strong>Código del producto:</strong> ${codigoProducto}
        </td>
      </tr>`
          : ''
      }
    `
    : `
      <tr>
        <td align="left" style="padding:14px 0 4px 0;font-size:15px;color:#0f172a;">
          <strong>Servicio:</strong> Póliza de Soporte y Acompañamiento
        </td>
      </tr>
    `;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
<head>
  <meta content="width=device-width" name="viewport"/>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta content="IE=edge" http-equiv="X-UA-Compatible"/>
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/>
  <style>@media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}</style>
</head>
<body dir="ltr" lang="es" style="margin:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0">
  <table border="0" width="100%" cellPadding="0" cellSpacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td dir="ltr" lang="es" style="margin:0px;padding:0px">
          <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;width:100%;border-radius:0px;margin:0 auto">
            <tbody>
              <tr style="width:100%">
                <td style="padding:8px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:1em;min-height:100%;line-height:155%">
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br/></p>
                  <img
                    alt="${bannerAlt}"
                    src="${bannerUrl}"
                    style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto;border-radius:8px"
                    width="100%"
                  />
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br/></p>
                  <h2 style="margin:0;padding:0;font-size:1.8em;line-height:1.44em;padding-top:0.389em;font-weight:600">
                    Hola ${clientName}
                  </h2>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    ID: ${identificacion}
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br/></p>
                  <p style="margin:0;padding:0;font-size:16px;padding-top:0.5em;padding-bottom:0.5em">
                    ${introMessage}
                  </p>
                  <p style="margin:0;padding:0;font-size:16px;padding-top:0.5em;padding-bottom:0.5em">
                    ¡Gracias por seguir confiando en nosotros! Tu continuidad nos motiva a seguir mejorando para que tu operación contable y administrativa cuente siempre con el mejor respaldo.
                  </p>
                  <p style="margin:0;padding:0"><br/></p>

                  <!-- Tarjeta Detalle de tu renovación -->
                  <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="width:100%;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:24px 28px;">
                    <tbody>
                      <tr>
                        <td align="left" style="padding-bottom:12px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:600;color:#0f172a;">
                          Detalle de tu renovación
                        </td>
                      </tr>
                      ${detailInfoHtml}
                      <tr>
                        <td align="center" style="padding-top:22px;padding-bottom:8px;font-size:15px;font-weight:600;color:#0f172a;">
                          Fecha de vencimiento
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:4px;">
                          <div style="display:inline-block;background-color:#212147;color:#ffffff;font-size:18px;font-weight:600;padding:12px 34px;border-radius:14px;text-align:center;">
                            ${formattedDate}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p style="margin:0;padding:0"><br/></p>
                  <p style="margin:0;padding:0;font-size:16px">
                    Si tienes alguna inquietud o requieres asistencia adicional, no dudes en comunicarte a nuestra línea de WhatsApp.
                  </p>
                  <p style="margin:0;padding:0"><br/></p>

                  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                    <tbody style="width:100%">
                      <tr style="width:100%">
                        <td align="center">
                          <a
                            class="button"
                            href="https://wa.me/573116017270"
                            style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;margin:0;padding:10px 18px;box-sizing:border-box;background-color:#000000;color:#ffffff;border-radius:6px;font-weight:600"
                            target="_blank"
                          >
                            <span style="max-width:100%;display:inline-block;line-height:120%">Contactar por WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p style="margin:0;padding:0"><br/></p>
                  <p style="margin:0;padding:0">
                    <span style="color:#afafaf">Esto es un mensaje automático. Por favor, no contestes. Estamos para ti en nuestros canales de atención. Gracias por elegirnos.</span>
                  </p>
                  <p style="margin:0;padding:0"><br/></p>
                  <p style="margin:0;padding:0"><br/></p>
                  <p style="margin:0;padding:0"><br/></p>

                  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                    <tbody style="width:100%">
                      <tr style="width:100%">
                        <td align="center">
                          <img
                            alt="Logotipo oscuro de DMD Asesorías con un icono en forma de estrella de cuatro puntas."
                            src="${FOOTER_LOGO_URL}"
                            style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto"
                            width="30%"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  return { subject, html };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const resendApiKey = (process.env.RESEND_APIKEY || process.env.RESEND_API_KEY || '').trim();
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Falta configurar la variable de entorno RESEND_APIKEY' });
  }

  const fromEmail = (
    process.env.RESEND_FROM_EMAIL || 'DMD Asesorías <notificaciones@dmdasesorias.com>'
  ).trim();

  const payload = (req.body || {}) as RenewalEmailPayload;
  const { to, clientName, identificacion, renewalType, newExpiryDate } = payload;

  if (!to || !clientName || !renewalType || !newExpiryDate) {
    return res.status(400).json({
      error: 'Faltan datos obligatorios para enviar el correo (to, clientName, renewalType, newExpiryDate).',
    });
  }

  try {
    const { subject, html } = buildRenewalEmailHtml({
      to,
      clientName,
      identificacion: identificacion || 'N/A',
      renewalType,
      newExpiryDate,
      licenseDetails: payload.licenseDetails,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to.trim()],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', result);
      return res.status(response.status).json({
        error: result?.message || 'Error al enviar correo a través de Resend',
        details: result,
      });
    }

    return res.status(200).json({
      message: 'Correo de renovación enviado exitosamente',
      id: result?.id,
    });
  } catch (error: any) {
    console.error('Error en send-renewal-email:', error);
    return res.status(500).json({
      error: error?.message || 'Error interno al enviar el correo de renovación',
    });
  }
}
