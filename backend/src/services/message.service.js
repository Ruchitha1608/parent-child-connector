const { prisma } = require('../config/database');

async function sendMessage(senderId, { receiverId, content, mediaUrl, messageType }) {
  const message = await prisma.message.create({
    data: { senderId, receiverId, content, mediaUrl, messageType: messageType || 'text' },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: senderId,
      eventType: 'message_sent',
      metadata: { receiverId, messageType: message.messageType },
    },
  });

  return message;
}

async function getConversation(userAId, userBId, { limit = 50, before } = {}) {
  const where = {
    OR: [
      { senderId: userAId, receiverId: userBId },
      { senderId: userBId, receiverId: userAId },
    ],
  };
  if (before) where.sentAt = { lt: new Date(before) };

  return prisma.message.findMany({
    where,
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { sentAt: 'desc' },
    take: parseInt(limit),
  });
}

async function markRead(messageIds, receiverId) {
  return prisma.message.updateMany({
    where: { id: { in: messageIds }, receiverId },
    data: { isRead: true },
  });
}

async function getUnreadCount(userId) {
  return prisma.message.count({
    where: { receiverId: userId, isRead: false },
  });
}

module.exports = { sendMessage, getConversation, markRead, getUnreadCount };
