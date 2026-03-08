const { prisma } = require('../config/database');

async function triggerSOS(childId, { latitude, longitude }) {
  const child = await prisma.user.findUnique({
    where: { id: childId },
    select: { id: true, name: true, pairedWith: true },
  });

  if (!child?.pairedWith) {
    const err = new Error('Child is not paired with a parent');
    err.status = 400;
    throw err;
  }

  const alert = await prisma.alert.create({
    data: {
      childId,
      parentId: child.pairedWith,
      alertType: 'sos',
      latitude,
      longitude,
      message: `SOS from ${child.name}`,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: childId,
      eventType: 'sos_triggered',
      description: 'Child triggered SOS alert',
      metadata: { latitude, longitude, alertId: alert.id },
    },
  });

  const { getIo } = require('../sockets');
  const io = getIo();
  io.to(`user:${child.pairedWith}`).emit('alert:sos', {
    alertId: alert.id,
    childId,
    childName: child.name,
    latitude,
    longitude,
    timestamp: alert.createdAt,
  });

  return alert;
}

async function getAlerts(parentId, { resolved, limit = 50, offset = 0 }) {
  const where = { parentId };
  if (resolved !== undefined) where.isResolved = resolved === 'true';

  return prisma.alert.findMany({
    where,
    include: { child: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  });
}

async function resolveAlert(alertId, parentId) {
  return prisma.alert.update({
    where: { id: alertId, parentId },
    data: { isResolved: true, resolvedAt: new Date() },
  });
}

module.exports = { triggerSOS, getAlerts, resolveAlert };
