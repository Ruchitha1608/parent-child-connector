const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/message.controller');

router.get('/', authenticate, c.getMessages);
router.patch('/read', authenticate, c.markRead);
router.get('/unread', authenticate, c.getUnread);

module.exports = router;
