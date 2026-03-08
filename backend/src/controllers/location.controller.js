const locationService = require('../services/location.service');
const { prisma } = require('../config/database');

async function updateLocation(req, res, next) {
  try {
    const { latitude, longitude, accuracy, speed, altitude, heading } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    const record = await locationService.saveLocation(req.user.id, {
      latitude, longitude, accuracy, speed, altitude, heading,
    });
    res.json(record);
  } catch (err) {
    next(err);
  }
}

async function getLatest(req, res, next) {
  try {
    const childId = req.query.childId || req.user.id;
    // Parents can query their paired child only
    if (req.user.role === 'parent') {
      const child = await prisma.user.findFirst({ where: { id: childId, pairedWith: req.user.id } });
      if (!child) return res.status(403).json({ error: 'Not authorized for this child' });
    }
    const loc = await locationService.getLatestLocation(childId);
    if (!loc) return res.status(404).json({ error: 'No location recorded yet' });
    res.json(loc);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { childId, date, limit, offset } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId is required' });
    if (req.user.role === 'parent') {
      const child = await prisma.user.findFirst({ where: { id: childId, pairedWith: req.user.id } });
      if (!child) return res.status(403).json({ error: 'Not authorized for this child' });
    }
    const history = await locationService.getLocationHistory(childId, { date, limit, offset });
    res.json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = { updateLocation, getLatest, getHistory };
