const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/reminder.controller');

router.post('/', authenticate, requireRole('parent'), c.create);
router.get('/', authenticate, c.list);
router.delete('/:id', authenticate, c.remove);

module.exports = router;
