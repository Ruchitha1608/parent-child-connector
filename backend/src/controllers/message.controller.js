const messageService = require('../services/message.service');
const { prisma } = require('../config/database');
const { getIo } = require('../sockets');
async function getPairedPartnerId(user) {
  if (user.role === 'parent') {
    const child = await prisma.user.findFirst({
      where: { pairedWith: user.id, role: 'child' },
      select: { id: true },
    });
    return child?.id;
  } else {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { pairedWith: true },
    });
    return me?.pairedWith;
  }
}

async function getMessages(req, res, next) {
  try {
    const partnerId = await getPairedPartnerId(req.user);
    if (!partnerId) return res.status(404).json({ error: 'No paired partner found' });

    const { limit, before } = req.query;
    const messages = await messageService.getConversation(req.user.id, partnerId, { limit, before });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds)) return res.status(400).json({ error: 'messageIds array required' });
    await messageService.markRead(messageIds, req.user.id);
    try { const io = getIo(); const msgs = await prisma.message.findMany({ where: { id: { in: messageIds } }, select: { senderId: true } }); const senders = [...new Set(msgs.map(m => m.senderId))]; senders.forEach(sid => io.to('user:' + sid).emit('message:read', { messageIds })); } catch {}
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}

async function getUnread(req, res, next) {
  try {
    const count = await messageService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, markRead, getUnread };
