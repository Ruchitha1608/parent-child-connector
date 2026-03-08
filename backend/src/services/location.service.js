const { prisma } = require('../config/database');
const { checkGeofences } = require('./geofence.service');

async function saveLocation(userId, { latitude, longitude, accuracy, speed, altitude, heading }) {
  const record = await prisma.locationHistory.create({
    data: { userId, latitude, longitude, accuracy, speed, altitude, heading },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      eventType: 'location_update',
      metadata: { latitude, longitude },
    },
  });

  // Trigger geofence check asynchronously (don't block response)
  checkGeofences(userId, latitude, longitude).catch(console.error);

  return record;
}

async function getLatestLocation(childId) {
  return prisma.locationHistory.findFirst({
    where: { userId: childId },
    orderBy: { recordedAt: 'desc' },
  });
}

async function getLocationHistory(childId, { date, limit = 200, offset = 0 }) {
  const where = { userId: childId };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.recordedAt = { gte: start, lte: end };
  }

  return prisma.locationHistory.findMany({
    where,
    orderBy: { recordedAt: 'asc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  });
}

module.exports = { saveLocation, getLatestLocation, getLocationHistory };
