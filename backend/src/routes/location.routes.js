const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/location.controller');

router.post('/update', authenticate, requireRole('child'), c.updateLocation);
router.get('/latest', authenticate, c.getLatest);
router.get('/history', authenticate, c.getHistory);

module.exports = router;
