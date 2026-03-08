const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { registerLocationHandlers } = require('./location.socket');
const { registerMessageHandlers } = require('./message.socket');
const { registerAlertHandlers } = require('./alert.socket');
const { registerVideoHandlers } = require('./video.socket');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // JWT authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, name, role } = socket.user;
    console.log(`[Socket] Connected: ${name} (${role}) — ${socket.id}`);

    // Each user joins their personal room
    socket.join(`user:${id}`);

    registerLocationHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerAlertHandlers(io, socket);
    registerVideoHandlers(io, socket);

    // Device status from child
    socket.on('device:status', async (data) => {
      try {
        if (socket.user.role !== 'child') return;
        const child = await require('../config/database').prisma.user.findUnique({ where: { id: id }, select: { pairedWith: true } });
        if (child?.pairedWith) io.to('user:' + child.pairedWith).emit('device:status', { ...data, childId: id });
      } catch {}
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${name} — ${reason}`);
    });
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIo };
