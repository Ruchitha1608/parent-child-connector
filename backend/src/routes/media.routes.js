const router = require('express').Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { uploadFile } = require('../services/media.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const folder = req.body.folder || 'media';
    const url = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
