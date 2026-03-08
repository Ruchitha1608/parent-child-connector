require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/sockets');
const { connectRedis } = require('./src/config/redis');
const { initMinio } = require('./src/config/minio');
const { startReminderCron } = require('./src/services/reminder.service');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectRedis();
    await initMinio();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    });

    startReminderCron();

    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received. Shutting down gracefully...');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
