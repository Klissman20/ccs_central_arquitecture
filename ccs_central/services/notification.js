// services/notification.js

/**
 * Simula envío de notificaciones.
 * notificationClient debe exponer send(channel, payload) que retorna promesa.
 */
async function sendNotifications(notificationClient, actions = [], context = {}) {
  if (!notificationClient || typeof notificationClient.send !== "function") {
    throw new Error("InvalidNotificationClient");
  }
  if (!Array.isArray(actions) || actions.length === 0) return [];

  const results = [];
  for (const a of actions) {
    // Acción puede ser 'notify_owner' | 'notify_authority'
    let channel = "email";
    if (a === "notify_owner") channel = "sms";
    if (a === "notify_authority") channel = "webhook";

    const payload = {
      action: a,
      context,
    };
    const res = await notificationClient.send(channel, payload);
    results.push({action: a, status: res});
  }
  return results;
}

module.exports = {sendNotifications};
