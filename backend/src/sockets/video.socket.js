/**
 * WebRTC Signaling via Socket.IO
 *
 * Flow:
 * 1. Parent requests video → REST POST /api/v1/video/request → server emits video:request to child
 * 2. Child accepts → REST POST /api/v1/video/respond → server emits video:response to parent
 * 3. Parent creates RTCPeerConnection, generates offer → emits video:offer
 * 4. Server relays offer to child
 * 5. Child creates answer → emits video:answer
 * 6. Server relays answer to parent
 * 7. Both sides exchange ICE candidates via video:ice-candidate
 * 8. P2P video call established
 */

function registerVideoHandlers(io, socket) {
  socket.on('video:offer', ({ sessionId, targetUserId, sdp }) => {
    io.to(`user:${targetUserId}`).emit('video:offer', {
      sessionId,
      fromUserId: socket.user.id,
      sdp,
    });
  });

  socket.on('video:answer', ({ sessionId, targetUserId, sdp }) => {
    io.to(`user:${targetUserId}`).emit('video:answer', {
      sessionId,
      fromUserId: socket.user.id,
      sdp,
    });
  });

  socket.on('video:ice-candidate', ({ sessionId, targetUserId, candidate }) => {
    io.to(`user:${targetUserId}`).emit('video:ice-candidate', {
      sessionId,
      fromUserId: socket.user.id,
      candidate,
    });
  });

  socket.on('video:end', ({ sessionId, targetUserId }) => {
    io.to(`user:${targetUserId}`).emit('video:end', { sessionId });
  });
}

module.exports = { registerVideoHandlers };
