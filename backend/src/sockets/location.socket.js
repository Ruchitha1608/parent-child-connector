const locationService = require('../services/location.service');
const { prisma } = require('../config/database');

function registerLocationHandlers(io, socket) {
  // Child emits their location
  socket.on('location:update', async (data) => {
    if (socket.user.role !== 'child') return;

    const { latitude, longitude, accuracy, speed, altitude, heading } = data;
    if (latitude == null || longitude == null) return;

    try {
      await locationService.saveLocation(socket.user.id, { latitude, longitude, accuracy, speed, altitude, heading });

      // Find paired parent and broadcast
      const child = await prisma.user.findUnique({
        where: { id: socket.user.id },
        select: { pairedWith: true, name: true },
      });

      if (child?.pairedWith) {
        io.to(`user:${child.pairedWith}`).emit('child:location', {
          childId: socket.user.id,
          childName: child.name,
          latitude,
          longitude,
          accuracy,
          speed,
          altitude,
          heading,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('[Socket] location:update error:', err.message);
    }
  });
}

module.exports = { registerLocationHandlers };
