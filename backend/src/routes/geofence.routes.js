const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/geofence.controller');

router.post('/', authenticate, requireRole('parent'), c.create);
router.get('/', authenticate, requireRole('parent'), c.list);
router.delete('/:id', authenticate, requireRole('parent'), c.remove);
router.patch('/:id/toggle', authenticate, requireRole('parent'), c.toggle);

module.exports = router;
