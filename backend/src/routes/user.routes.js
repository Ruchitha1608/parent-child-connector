const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../config/database');

// GET /api/v1/users/paired-child  (parent gets their paired child's info)
router.get('/paired-child', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') return res.status(403).json({ error: 'Parents only' });
    const child = await prisma.user.findFirst({
      where: { pairedWith: req.user.id, role: 'child' },
      select: { id: true, name: true, email: true, avatarUrl: true, isActive: true },
    });
    if (!child) return res.status(404).json({ error: 'No paired child found' });
    res.json(child);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/paired-parent  (child gets their parent's info)
router.get('/paired-parent', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'child') return res.status(403).json({ error: 'Children only' });
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { pairedWith: true },
    });
    if (!me?.pairedWith) return res.status(404).json({ error: 'Not paired with a parent' });
    const parent = await prisma.user.findUnique({
      where: { id: me.pairedWith },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    res.json(parent);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/me  (update own profile)
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(phone !== undefined && { phone }) },
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

module.exports = router;
