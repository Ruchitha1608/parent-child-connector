const geoService = require('../services/geofence.service');
const { prisma } = require('../config/database');

async function create(req, res, next) {
  try {
    const { childId, label, centerLat, centerLng, radiusM } = req.body;
    if (!childId || !label || centerLat == null || centerLng == null || !radiusM) {
      return res.status(400).json({ error: 'childId, label, centerLat, centerLng, radiusM required' });
    }
    const child = await prisma.user.findFirst({ where: { id: childId, pairedWith: req.user.id } });
    if (!child) return res.status(403).json({ error: 'Not authorized for this child' });

    const gf = await geoService.createGeofence(req.user.id, childId, { label, centerLat, centerLng, radiusM });
    res.status(201).json(gf);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const childId = req.query.childId;
    if (!childId) return res.status(400).json({ error: 'childId required' });
    const child = await prisma.user.findFirst({ where: { id: childId, pairedWith: req.user.id } });
    if (!child) return res.status(403).json({ error: 'Not authorized' });
    const fences = await geoService.getGeofences(req.user.id, childId);
    res.json(fences);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await geoService.deleteGeofence(req.params.id, req.user.id);
    res.json({ message: 'Geofence deleted' });
  } catch (err) {
    next(err);
  }
}

async function toggle(req, res, next) {
  try {
    const { isActive } = req.body;
    const gf = await geoService.toggleGeofence(req.params.id, req.user.id, isActive);
    res.json(gf);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, remove, toggle };
