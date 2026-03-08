const turf = require('@turf/turf');
const { prisma } = require('../config/database');
const { getRedis } = require('../config/redis');

// Key stores last known inside/outside state per geofence per user
function geofenceStateKey(userId, geofenceId) {
  return `gf:state:${userId}:${geofenceId}`;
}

async function checkGeofences(childId, latitude, longitude) {
  const geofences = await prisma.geofence.findMany({
    where: { childId, isActive: true },
    include: { parent: { select: { id: true } } },
  });

  if (!geofences.length) return;

  const childPoint = turf.point([longitude, latitude]);
  const redis = getRedis();
  const io = getIo();

  for (const gf of geofences) {
    const circle = turf.circle(
      [gf.centerLng, gf.centerLat],
      gf.radiusM / 1000, // turf uses km
      { units: 'kilometers' }
    );

    const isInside = turf.booleanPointInPolygon(childPoint, circle);
    const stateKey = geofenceStateKey(childId, gf.id);
    const prevState = await redis.get(stateKey); // 'inside' | 'outside' | null

    await redis.setex(stateKey, 3600 * 24, isInside ? 'inside' : 'outside');

    // Only alert on transition from inside → outside
    if (prevState === 'inside' && !isInside) {
      const alert = await prisma.alert.create({
        data: {
          childId,
          parentId: gf.parent.id,
          alertType: 'geofence_breach',
          latitude,
          longitude,
          message: `Child left "${gf.label}"`,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: childId,
          eventType: 'geofence_breach',
          description: `Left geofence: ${gf.label}`,
          metadata: { geofenceId: gf.id, latitude, longitude },
        },
      });

      // Emit to parent's socket room
      const { getIo } = require('../sockets');
      const io = getIo();
      io.to(`user:${gf.parent.id}`).emit('alert:incoming', {
        type: 'geofence_breach',
        alertId: alert.id,
        message: alert.message,
        latitude,
        longitude,
        geofenceLabel: gf.label,
        timestamp: alert.createdAt,
      });
    }
  }
}

async function createGeofence(parentId, childId, { label, centerLat, centerLng, radiusM }) {
  return prisma.geofence.create({
    data: { parentId, childId, label, centerLat, centerLng, radiusM },
  });
}

async function getGeofences(parentId, childId) {
  return prisma.geofence.findMany({
    where: { parentId, childId },
    orderBy: { createdAt: 'desc' },
  });
}

async function deleteGeofence(id, parentId) {
  return prisma.geofence.delete({ where: { id, parentId } });
}

async function toggleGeofence(id, parentId, isActive) {
  return prisma.geofence.update({ where: { id, parentId }, data: { isActive } });
}

module.exports = { checkGeofences, createGeofence, getGeofences, deleteGeofence, toggleGeofence };
