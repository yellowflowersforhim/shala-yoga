async function testSendReminderAPI() {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new Error('CRON_SECRET no está configurado');

    const response = await fetch('http://localhost:3000/api/reminders/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const result = await response.json();
    console.log('Resultado del envío de recordatorios:', result);
  } catch (err) {
    console.error('Error al testear la API:', err);
  }
}

// Ejecutar test
testSendReminderAPI();
