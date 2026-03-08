const alertService = require('../services/alert.service');

async function triggerSOS(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    const alert = await alertService.triggerSOS(req.user.id, { latitude, longitude });
    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
}

async function getAlerts(req, res, next) {
  try {
    const alerts = await alertService.getAlerts(req.user.id, req.query);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const alert = await alertService.resolveAlert(req.params.id, req.user.id);
    res.json(alert);
  } catch (err) {
    next(err);
  }
}

module.exports = { triggerSOS, getAlerts, resolveAlert };
