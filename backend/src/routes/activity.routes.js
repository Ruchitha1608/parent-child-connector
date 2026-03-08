const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/activity.controller');

router.get('/', authenticate, c.getActivity);
router.post('/', authenticate, c.logActivity);

module.exports = router;
