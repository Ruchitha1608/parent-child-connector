const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const locationRoutes = require('./routes/location.routes');
const messageRoutes = require('./routes/message.routes');
const alertRoutes = require('./routes/alert.routes');
const geofenceRoutes = require('./routes/geofence.routes');
const activityRoutes = require('./routes/activity.routes');
const reminderRoutes = require('./routes/reminder.routes');
const videoRoutes = require('./routes/video.routes');
const mediaRoutes = require('./routes/media.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/geofences', geofenceRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/video', videoRoutes);
app.use('/api/v1/media', mediaRoutes);

app.use(errorHandler);

module.exports = app;
