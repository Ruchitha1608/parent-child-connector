const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/alert.controller');

router.post('/sos', authenticate, requireRole('child'), c.triggerSOS);
router.get('/', authenticate, requireRole('parent'), c.getAlerts);
router.patch('/:id/resolve', authenticate, requireRole('parent'), c.resolveAlert);

module.exports = router;
