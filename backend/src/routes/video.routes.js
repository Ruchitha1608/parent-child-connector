const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/video.controller');

router.post('/request', authenticate, requireRole('parent'), c.requestVerification);
router.post('/respond', authenticate, requireRole('child'), c.respondToRequest);
router.post('/complete', authenticate, c.completeSession);
router.post('/selfie', authenticate, requireRole('child'), c.submitSelfie);
router.get('/history', authenticate, requireRole('parent'), c.getHistory);
router.get('/my-history', authenticate, requireRole('child'), c.getChildHistory);

module.exports = router;
