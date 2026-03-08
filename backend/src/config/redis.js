const Redis = require('ioredis');

let client;
let redisAvailable = false;

// In-memory fallback store (for demo/dev when Redis is not installed)
const memStore = new Map();

async function connectRedis() {
  try {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) return null; // stop retrying fast
        return 500;
      },
      lazyConnect: true,
    });

    client.on('error', () => {}); // suppress error spam
    await client.connect();
    await client.ping();
    redisAvailable = true;
    console.log('[Redis] Connected');
  } catch {
    redisAvailable = false;
    console.warn('[Redis] Not available — using in-memory fallback (fine for dev/demo)');
  }
}

function getRedis() {
  if (redisAvailable && client) return client;

  // Return a minimal in-memory shim so the rest of the app works
  return {
    get: async (key) => memStore.get(key) ?? null,
    set: async (key, val) => { memStore.set(key, val); return 'OK'; },
    setex: async (key, _ttl, val) => { memStore.set(key, val); return 'OK'; },
    del: async (key) => { memStore.delete(key); return 1; },
    ping: async () => 'PONG',
  };
}

module.exports = { connectRedis, getRedis };
