const { prisma } = require('../config/database');

async function getActivity(req, res, next) {
  try {
    const { limit = 100, offset = 0, eventType } = req.query;

    let targetUserId = req.user.id;

    // If parent is requesting child's activity
    if (req.user.role === 'parent' && req.query.childId) {
      const child = await prisma.user.findFirst({
        where: { id: req.query.childId, pairedWith: req.user.id },
      });
      if (!child) return res.status(403).json({ error: 'Not authorized' });
      targetUserId = child.id;
    }

    const where = { userId: targetUserId };
    if (eventType) where.eventType = eventType;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function logActivity(req, res, next) {
  try {
    const { eventType, description, metadata } = req.body;
    if (!eventType) return res.status(400).json({ error: 'eventType required' });
    const log = await prisma.activityLog.create({
      data: { userId: req.user.id, eventType, description, metadata },
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

module.exports = { getActivity, logActivity };
