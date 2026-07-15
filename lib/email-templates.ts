export interface EmailBrand {
  name?: string;
  primaryColor?: string;
  primaryColorDark?: string;
}

const DEFAULT_BRAND: Required<Pick<EmailBrand, 'primaryColor' | 'primaryColorDark' | 'name'>> = {
  primaryColor: '#0f766e',
  primaryColorDark: '#115e59',
  name: 'Shala',
};

function resolve(brand?: EmailBrand) {
  return {
    c: brand?.primaryColor || DEFAULT_BRAND.primaryColor,
    cd: brand?.primaryColorDark || DEFAULT_BRAND.primaryColorDark,
    sender: brand?.name || DEFAULT_BRAND.name,
  };
}

export const thankYouEmailTemplate = (studentName: string, programName: string, brand?: EmailBrand) => {
  const { c, cd, sender } = resolve(brand);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${c} 0%, ${cd} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: ${c};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>¡Gracias por Completar tu Programa!</h1>
  </div>
  <div class="content">
    <p>Hola ${studentName},</p>
    
    <p>Queremos agradecerte por completar el programa <strong>${programName}</strong>. Ha sido un honor acompañarte en este viaje de transformación a través del Classical Hatha Yoga.</p>
    
    <p>Esperamos que esta práctica haya traído cambios positivos a tu vida y que continúes explorando las profundidades del yoga.</p>
    
    <h3>Comparte tu Experiencia</h3>
    <p>Tu opinión es muy valiosa para nosotros y para otros estudiantes que están considerando iniciar su camino en el yoga. ¿Te gustaría compartir tu experiencia?</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/feedback" class="button">
        Dejar mi Feedback
      </a>
    </div>
    
    <p>Namaste,<br>
    <strong>Tu Instructor</strong><br>
    ${sender}</p>
  </div>
  <div class="footer">
    <p>Este email fue enviado desde ${sender}</p>
  </div>
</body>
</html>
`;
};

export const feedbackReminderTemplate = (studentName: string, programName: string, brand?: EmailBrand) => {
  const { c, cd, sender } = resolve(brand);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${c} 0%, ${cd} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: ${c};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tu Opinión Importa</h1>
  </div>
  <div class="content">
    <p>Hola ${studentName},</p>
    
    <p>Han pasado unos días desde que completaste el programa <strong>${programName}</strong> y queremos saber cómo ha sido tu experiencia.</p>
    
    <p>Tu feedback nos ayuda a mejorar constantemente y a ofrecer la mejor experiencia posible a todos nuestros estudiantes.</p>
    
    <p>¿Podrías tomarte unos minutos para compartir tus pensamientos?</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/feedback" class="button">
        Compartir mi Experiencia
      </a>
    </div>
    
    <p>Gracias por tu tiempo y por ser parte de nuestra comunidad.</p>
    
    <p>Namaste,<br>
    <strong>Tu Instructor</strong><br>
    ${sender}</p>
  </div>
  <div class="footer">
    <p>Este email fue enviado desde ${sender}</p>
  </div>
</body>
</html>
`;
};

export const enrollmentConfirmationTemplate = (
  name: string,
  programTitle: string,
  cohortName: string,
  startDate: string,
  location: string,
  scheduleText: string,
  googleFormUrl: string,
  brand?: EmailBrand,
) => {
  const { c, cd, sender } = resolve(brand);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${c} 0%, ${cd} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: ${c};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>¡Inscripción Confirmada!</h1>
  </div>
  <div class="content">
    <p>Hola ${name},</p>
    
    <p>¡Bienvenido a ${programTitle}!</p>
    
    <div class="info-box">
      <strong>Detalles de tu inscripción:</strong><br>
      <strong>Programa:</strong> ${programTitle}<br>
      <strong>Intensivo:</strong> ${cohortName}<br>
      <strong>Fecha de inicio:</strong> ${startDate}<br>
      <strong>Ubicación:</strong> ${location}<br>
      <strong>Horario:</strong> ${scheduleText}
    </div>

    <h3>📋 Paso importante: Completa tu información</h3>
    <p>Para finalizar tu inscripción, necesitamos que completes el siguiente formulario:</p>
    
    <div style="text-align: center;">
      <a href="${googleFormUrl}" class="button">Completar formulario de inscripción</a>
    </div>

    <p>Namaste,<br>
    <strong>Tu Instructor</strong><br>
    ${sender}</p>
  </div>
  <div class="footer">
    <p>Este email fue enviado desde ${sender}</p>
  </div>
</body>
</html>
`;
};

export const reminderEmailTemplate = (
  name: string,
  programTitle: string,
  cohortName: string,
  startDate: string,
  startTime: string,
  location: string,
  scheduleText: string,
  brand?: EmailBrand,
) => {
  const { c, cd, sender } = resolve(brand);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${c} 0%, ${cd} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .highlight-box {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔔 Recordatorio: Tu Intensivo Comienza Mañana</h1>
  </div>
  <div class="content">
    <p>Hola ${name},</p>
    
    <p>Este es un recordatorio de que tu intensivo de ${programTitle} comienza mañana.</p>
    
    <div class="highlight-box">
      <h2 style="margin: 0 0 10px 0; color: #1e40af;">Detalles del Intensivo</h2>
      <p style="margin: 5px 0;"><strong>Programa:</strong> ${programTitle}</p>
      <p style="margin: 5px 0;"><strong>Intensivo:</strong> ${cohortName}</p>
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${startDate}</p>
      <p style="margin: 5px 0;"><strong>Hora:</strong> ${startTime}</p>
      <p style="margin: 5px 0;"><strong>Ubicación:</strong> ${location}</p>
    </div>

    <div class="highlight-box">
      <h2 style="margin: 0 0 10px 0; color: #1e40af;">Recomendaciones</h2>
      <p style="margin: 5px 0;"><strong>¿Qué hora debo llegar?:</strong>Llega con al menos 15 minutos de antelación</p>
      <p style="margin: 5px 0;"><strong>¿Condición de estómago?:</strong>Practica en ayunas o con al menos 4 horas desde tu última comida completa (2.5h desde tu ultimo snack, 1.5h desde tu ultima bebida(zumo/bebidas). Agua puedes beber siempre)</p>
      <p style="margin: 5px 0;"><strong>Material:</strong> Trae tu propia esterilla y cojines, si necesitas, para sentarte en el suelo</p>
      <p style="margin: 5px 0;"><strong>Ropa:</strong>Usa ropa cómoda y ligera, preferiblemente de algodón</p>
      <p style="margin: 5px 0;"><strong>Ubicación:</strong> ${location}</p>
    </div>
    <p><strong>Horario:</strong> ${scheduleText}</p>

    <p>Te esperamos con mucha ilusión.</p>
    
    <p>Namaste,<br>
    <strong>Tu Instructor</strong><br>
    ${sender}</p>
  </div>
  <div class="footer">
    <p>Este email fue enviado desde ${sender}</p>
  </div>
</body>
</html>
`;
};

export const completionThankYouTemplate = (
  name: string,
  programTitle: string,
  cohortName: string,
  brand?: EmailBrand,
) => {
  const { c, cd, sender } = resolve(brand);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${c} 0%, ${cd} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: ${c};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 ¡Felicitaciones!</h1>
  </div>
  <div class="content">
    <p>Hola ${name},</p>
    
    <p>¡Felicitaciones por completar ${programTitle} - ${cohortName}!</p>
    
    <p>Ha sido un honor acompañarte en este viaje de transformación. Esperamos que esta experiencia haya sido enriquecedora y significativa para ti.</p>
    
    <h3>Comparte tu Experiencia</h3>
    <p>Tu opinión es muy valiosa para nosotros. ¿Te gustaría compartir tu experiencia?</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/feedback" class="button">
        Dejar mi Feedback
      </a>
    </div>
    
    <p>Namaste,<br>
    <strong>Tu Instructor</strong><br>
    ${sender}</p>
  </div>
  <div class="footer">
    <p>Este email fue enviado desde ${sender}</p>
  </div>
</body>
</html>
`;
};

export const adminEnrollmentNotificationTemplate = (
  studentName: string,
  studentEmail: string,
  programTitle: string,
  cohortName: string,
  orderNumber: string,
  amountPaid: string,
  isGuest: boolean = false,
  brand?: EmailBrand,
) => {
  const { c, cd, sender } = resolve(brand);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${c} 0%, ${cd} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .info-row {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .label {
      font-weight: bold;
      color: ${cd};
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Nueva Inscripción</h1>
  </div>
  <div class="content">
    <h2>Detalles de la Inscripción:</h2>
    
    <div class="info-row">
      <span class="label">👤 Estudiante:</span> ${studentName} ${isGuest ? '(Invitado)' : ''}
    </div>
    <div class="info-row">
      <span class="label">📧 Email:</span> ${studentEmail}
    </div>
    <div class="info-row">
      <span class="label">📚 Programa:</span> ${programTitle}
    </div>
    <div class="info-row">
      <span class="label">🗓️ Intensivo:</span> ${cohortName}
    </div>
    <div class="info-row">
      <span class="label">🔢 Número de Pedido:</span> ${orderNumber}
    </div>
    <div class="info-row">
      <span class="label">💰 Monto Pagado:</span> ${amountPaid}
    </div>
    
    <p style="margin-top: 20px; color: #666;">
      Recibido: ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
    </p>
  </div>
  <div class="footer">
    <p>Sistema de Gestión - ${sender}</p>
  </div>
</body>
</html>
`;
};
