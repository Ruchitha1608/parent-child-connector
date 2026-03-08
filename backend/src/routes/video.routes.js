const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/video.controller');

router.post('/request', authenticate, requireRole('parent'), c.requestVerification);
router.post('/respond', authenticate, requireRole('child'), c.respondToRequest);
router.post('/complete', authenticate, c.completeSession);
router.get('/history', authenticate, requireRole('parent'), c.getHistory);

module.exports = router;
