const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/auth.controller');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.post('/logout', authenticate, c.logout);
router.post('/pair', authenticate, c.pair);
router.get('/me', authenticate, c.me);

module.exports = router;
