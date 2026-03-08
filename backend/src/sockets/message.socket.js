const messageService = require('../services/message.service');
const { prisma } = require('../config/database');

function registerMessageHandlers(io, socket) {
  socket.on('message:send', async (data) => {
    const { content, mediaUrl, messageType } = data;
    if (!content && !mediaUrl) return;

    try {
      // Find paired partner
      let receiverId;
      if (socket.user.role === 'parent') {
        const child = await prisma.user.findFirst({
          where: { pairedWith: socket.user.id, role: 'child' },
          select: { id: true },
        });
        receiverId = child?.id;
      } else {
        const me = await prisma.user.findUnique({
          where: { id: socket.user.id },
          select: { pairedWith: true },
        });
        receiverId = me?.pairedWith;
      }

      if (!receiverId) return;

      const message = await messageService.sendMessage(socket.user.id, {
        receiverId,
        content,
        mediaUrl,
        messageType,
      });

      // Send to receiver
      io.to(`user:${receiverId}`).emit('message:receive', message);
      // Confirm back to sender with the saved message
      socket.emit('message:sent', message);
    } catch (err) {
      console.error('[Socket] message:send error:', err.message);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  });

  socket.on('message:typing', () => {
    // Relay typing indicator to partner
    socket.broadcast.emit('message:typing', { from: socket.user.id });
  });
}

module.exports = { registerMessageHandlers };
