const alertService = require('../services/alert.service');

function registerAlertHandlers(io, socket) {
  // Child can also emit SOS via socket (fallback to REST /api/v1/alerts/sos)
  socket.on('alert:sos', async (data) => {
    if (socket.user.role !== 'child') return;
    const { latitude, longitude } = data || {};

    try {
      await alertService.triggerSOS(socket.user.id, { latitude, longitude });
      socket.emit('alert:sos:ack', { success: true });
    } catch (err) {
      console.error('[Socket] alert:sos error:', err.message);
      socket.emit('alert:sos:ack', { success: false, error: err.message });
    }
  });
}

module.exports = { registerAlertHandlers };
